'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/auth-store';

// Routes accessible to proveedor role
const PROVEEDOR_ALLOWED = ['/dashboard', '/promociones', '/cupones'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
    } else {
      loadFromStorage();
      setReady(true);
    }
  }, [router, loadFromStorage]);

  // Route guard: redirect proveedor away from restricted routes
  useEffect(() => {
    if (!ready || !user) return;
    if (user.rol === 'proveedor') {
      const allowed = PROVEEDOR_ALLOWED.some((r) => pathname === r || pathname.startsWith(r + '/'));
      if (!allowed) {
        router.replace('/dashboard');
      }
    }
  }, [ready, user, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-900">{children}</main>
      </div>
    </div>
  );
}
