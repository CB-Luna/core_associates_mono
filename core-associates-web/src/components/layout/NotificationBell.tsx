'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { usePermisos } from '@/lib/permisos';
import type { NotificacionCRM } from '@/lib/api-types';

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationBell() {
  const router = useRouter();
  const { puede } = usePermisos();
  const tienePermiso = puede('notificaciones-crm:ver');
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionCRM[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll no-leidas count
  const fetchCount = useCallback(async () => {
    try {
      const res = await apiClient<{ count: number }>('/notificaciones-crm/no-leidas/count');
      setCount(res.count);
    } catch {
      // silent — user might not have permission
    }
  }, []);

  useEffect(() => {
    if (!tienePermiso) return;
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount, tienePermiso]);

  // Fetch recent when opening
  const fetchRecent = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await apiClient<{ data: NotificacionCRM[] }>('/notificaciones-crm?limit=8');
      setNotificaciones(res.data);
    } catch {
      setNotificaciones([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (open && tienePermiso) fetchRecent();
  }, [open, fetchRecent, tienePermiso]);

  if (!tienePermiso) return null;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await apiClient('/notificaciones-crm/leer-todas', { method: 'PUT' });
      setCount(0);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch {
      // ignore
    }
  };

  const handleClick = async (noti: NotificacionCRM) => {
    // Mark as read
    if (!noti.leida) {
      try {
        await apiClient(`/notificaciones-crm/${noti.id}/leer`, { method: 'PUT' });
        setCount((c) => Math.max(0, c - 1));
        setNotificaciones((prev) => prev.map((n) => n.id === noti.id ? { ...n, leida: true } : n));
      } catch {
        // ignore
      }
    }
    // Navigate if there's a reference
    if (noti.referenciaId && noti.referenciaTipo === 'caso_legal') {
      setOpen(false);
      router.push(`/casos-legales/${noti.referenciaId}`);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</p>
            {count > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline">
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No hay notificaciones</p>
              </div>
            ) : (
              notificaciones.map((noti) => (
                <button
                  key={noti.id}
                  onClick={() => handleClick(noti)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    !noti.leida ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  {!noti.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!noti.leida ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {noti.titulo}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{noti.mensaje}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(noti.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
