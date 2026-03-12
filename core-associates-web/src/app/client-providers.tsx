'use client';

import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/lib/theme-provider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
