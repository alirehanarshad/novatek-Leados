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
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
