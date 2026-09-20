import logging
from typing import AsyncGenerator
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)

# Normalize DATABASE_URL for async
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("sqlite:///") and not db_url.startswith("sqlite+aiosqlite:///"):
    db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

try:
    engine = create_async_engine(
        db_url,
        echo=False,
        future=True,
    )
except Exception as e:
    logger.warning(f"Failed to connect to primary DB {db_url}: {e}. Falling back to SQLite.")
    fallback_url = "sqlite+aiosqlite:///./lead_os.db"
    engine = create_async_engine(fallback_url, echo=False, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure new ICP columns exist if table already created
        new_columns = [
            ("smb_tier", "VARCHAR(50)"),
            ("recommended_service", "VARCHAR(255)"),
            ("google_maps_url", "VARCHAR(500)")
        ]
        for col_name, col_type in new_columns:
            try:
                await conn.execute(text(f"ALTER TABLE leads ADD COLUMN {col_name} {col_type}"))
            except Exception:
                pass

    # Seed default admin user if none exists
    from app.models.user import User
    from app.core.security import get_password_hash
    async with AsyncSessionLocal() as session:
        try:
            res = await session.execute(select(User).limit(1))
            user = res.scalars().first()
            if not user:
                admin_user = User(
                    email="admin@novatek.io",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Novatek Team Admin",
                    is_active=True,
                    is_superuser=True
                )
                session.add(admin_user)
                await session.commit()
                logger.info("Seeded default team admin user: admin@novatek.io (password: admin123)")
        except Exception as e:
            logger.warning(f"User seeding check: {e}")
