import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM or settings.SMTP_USER

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> Dict[str, Any]:
        """Sends an outreach email via configured SMTP server."""
        if not self.host or not self.user or not self.password:
            logger.warning("SMTP is not fully configured. Simulating delivery for local testing.")
            return {
                "success": True,
                "simulated": True,
                "message": f"Simulated email sent to {to_email}"
            }

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to_email

            if is_html:
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))

            # Dispatch via SMTP
            with smtplib.SMTP(self.host, self.port, timeout=15) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.sendmail(self.from_email, [to_email], msg.as_string())

            return {"success": True, "simulated": False, "message": f"Email successfully delivered to {to_email}"}

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {"success": False, "simulated": False, "error": str(e)}

email_service = EmailService()
