import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Novatek LeadOS | Enterprise AI Lead Intelligence & Outbound CRM',
  description: 'Autonomous lead discovery, website crawler enrichment, and multi-model AI prospecting platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-ambient-orb orb-1" />
        <div className="bg-ambient-orb orb-2" />
        <div className="bg-ambient-orb orb-3" />
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
