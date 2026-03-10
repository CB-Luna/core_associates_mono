import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/app/client-providers';

export const metadata: Metadata = {
  title: 'Core Associates - CRM',
  description: 'Panel de administración de la Asociación Civil de Conductores',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 antialiased dark:bg-gray-900 dark:text-gray-100" suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
