'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw } from 'lucide-react';
import Sidebar from './Sidebar';

const PUBLIC_PATHS = ['/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push('/login');
    }
  }, [user, loading, isPublic, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        gap: '12px'
      }}>
        <RefreshCw size={28} className="animate-spin" color="#818cf8" />
        <div style={{ fontSize: '14px', fontWeight: 500 }}>Initializing Novatek LeadOS security...</div>
      </div>
    );
  }

  // If on login or register, render children without sidebar
  if (isPublic) {
    return <>{children}</>;
  }

  // If not logged in, prevent flashing main screen while redirecting
  if (!user) {
    return null;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
