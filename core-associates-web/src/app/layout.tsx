import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="es">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
