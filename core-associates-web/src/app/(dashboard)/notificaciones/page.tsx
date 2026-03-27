'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { usePermisos } from '@/lib/permisos';
import type { NotificacionCRM } from '@/lib/api-types';

const tipoIcon: Record<string, string> = {
  caso_nuevo: '🆕',
  caso_disponible: '📋',
  caso_asignado: '👤',
  estado_cambio: '🔄',
  documento_pendiente: '📄',
  nuevo_asociado: '🙋',
  cupon_canjeado: '🎫',
  default: '🔔',
};

export default function NotificacionesPage() {
  const router = useRouter();
  const { puede } = usePermisos();
  const tienePermiso = puede('notificaciones-crm:ver');

  const [notificaciones, setNotificaciones] = useState<NotificacionCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtroLeida, setFiltroLeida] = useState<'todas' | 'no_leidas' | 'leidas'>('todas');

  const LIMIT = 20;

  const fetchNotificaciones = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filtroLeida === 'no_leidas') params.set('leida', 'false');
      if (filtroLeida === 'leidas') params.set('leida', 'true');

      const res = await apiClient<PaginatedResponse<NotificacionCRM>>(
        `/notificaciones-crm?${params.toString()}`,
      );
      setNotificaciones(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      setNotificaciones([]);
    } finally {
      setLoading(false);
    }
  }, [page, filtroLeida]);

  useEffect(() => {
    if (tienePermiso) fetchNotificaciones();
  }, [fetchNotificaciones, tienePermiso]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filtroLeida]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiClient('/notificaciones-crm/leer-todas', { method: 'PUT' });
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (noti: NotificacionCRM) => {
    if (!noti.leida) {
      try {
        await apiClient(`/notificaciones-crm/${noti.id}/leer`, { method: 'PUT' });
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === noti.id ? { ...n, leida: true } : n)),
        );
      } catch { /* ignore */ }
    }
    if (noti.referenciaId && noti.referenciaTipo === 'caso_legal') {
      router.push(`/casos-legales/${noti.referenciaId}`);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`;
    return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const noLeidasCount = notificaciones.filter((n) => !n.leida).length;

  if (!tienePermiso) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Bell className="mb-3 h-12 w-12" />
        <p className="text-sm">Sin acceso a notificaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} notificación{total !== 1 ? 'es' : ''} en total
          </p>
        </div>
        {noLeidasCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4 text-green-500" />
            {markingAll ? 'Marcando...' : `Marcar ${noLeidasCount} como leída${noLeidasCount > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['todas', 'no_leidas', 'leidas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroLeida(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filtroLeida === f
                ? 'bg-primary-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'no_leidas' ? 'No leídas' : 'Leídas'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell className="mb-3 h-10 w-10" />
            <p className="text-sm">
              {filtroLeida === 'no_leidas' ? 'No tienes notificaciones pendientes' : 'No hay notificaciones'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notificaciones.map((noti) => (
              <div
                key={noti.id}
                className={`flex items-start gap-4 px-5 py-4 ${
                  !noti.leida ? 'bg-primary-50/40' : 'hover:bg-gray-50/60'
                } ${noti.referenciaId ? 'cursor-pointer' : ''}`}
                onClick={() => handleClick(noti)}
              >
                {/* Icono tipo */}
                <span className="mt-0.5 text-xl leading-none" role="img" aria-label={noti.tipo}>
                  {tipoIcon[noti.tipo] ?? tipoIcon.default}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!noti.leida ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {noti.titulo}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {!noti.leida && (
                        <span className="h-2 w-2 rounded-full bg-primary-500" />
                      )}
                      <span className="whitespace-nowrap text-xs text-gray-400">{timeAgo(noti.createdAt)}</span>
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{noti.mensaje}</p>
                  {noti.referenciaId && noti.referenciaTipo === 'caso_legal' && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600">
                      <ExternalLink className="h-3 w-3" />
                      Ver caso
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
