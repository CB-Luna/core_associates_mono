'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { type AuditoriaRecord } from '@/lib/api-types';
import { type PaginatedResponse } from '@/lib/api-client';
import { formatFechaConHora } from '@/lib/utils';
import { Shield, Search, Filter, RefreshCw, FileText, Pencil, Trash2, ToggleRight, LogIn } from 'lucide-react';

const ACCION_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string; bg: string }> = {
  crear: { label: 'Crear', icon: FileText, color: 'text-green-700', bg: 'bg-green-50' },
  actualizar: { label: 'Actualizar', icon: Pencil, color: 'text-blue-700', bg: 'bg-blue-50' },
  eliminar: { label: 'Eliminar', icon: Trash2, color: 'text-red-700', bg: 'bg-red-50' },
  cambio_estado: { label: 'Cambio Estado', icon: ToggleRight, color: 'text-amber-700', bg: 'bg-amber-50' },
  login: { label: 'Login', icon: LogIn, color: 'text-purple-700', bg: 'bg-purple-50' },
};

const ENTIDAD_CONFIG: Record<string, { label: string; badge: 'info' | 'success' | 'warning' | 'danger' | 'default' }> = {
  asociado: { label: 'Asociado', badge: 'info' },
  cupon: { label: 'Cupón', badge: 'success' },
  promocion: { label: 'Promoción', badge: 'warning' },
  proveedor: { label: 'Proveedor', badge: 'default' },
  caso_legal: { label: 'Caso Legal', badge: 'danger' },
  documento: { label: 'Documento', badge: 'info' },
  usuario: { label: 'Usuario', badge: 'default' },
};

export function AuditoriaTab() {
  const [auditLogs, setAuditLogs] = useState<AuditoriaRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditMeta, setAuditMeta] = useState({ total: 0, totalPages: 1 });
  const [auditFilters, setAuditFilters] = useState({ entidad: '', accion: '', search: '' });
  const [selectedLog, setSelectedLog] = useState<AuditoriaRecord | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ page: String(auditPage), limit: '15' });
      if (auditFilters.entidad) params.set('entidad', auditFilters.entidad);
      if (auditFilters.accion) params.set('accion', auditFilters.accion);
      if (auditFilters.search) params.set('search', auditFilters.search);
      const res = await apiClient<PaginatedResponse<AuditoriaRecord>>(`/auditoria?${params}`);
      setAuditLogs(res.data);
      setAuditMeta({ total: res.meta.total, totalPages: res.meta.totalPages });
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditFilters]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const clearFilters = () => {
    setAuditFilters({ entidad: '', accion: '', search: '' });
    setAuditPage(1);
  };

  const hasFilters = auditFilters.entidad || auditFilters.accion || auditFilters.search;

  const auditColumns: ColumnDef<AuditoriaRecord, unknown>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ getValue }) => {
        const v = getValue();
        return v ? (
          <span className="text-xs text-gray-600">{formatFechaConHora(v as string)}</span>
        ) : '—';
      },
    },
    {
      id: 'usuarioNombre',
      header: 'Usuario',
      meta: {
        exportValue: (r: AuditoriaRecord) => r.usuario ? `${r.usuario.nombre} (${r.usuario.rol})` : 'Sistema',
      },
      cell: ({ row }) => {
        const u = row.original.usuario;
        if (!u) return <span className="text-gray-400">Sistema</span>;
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-[10px] font-bold text-gray-600">
              {u.nombre?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{u.nombre}</p>
              <p className="truncate text-[11px] text-gray-400">{u.rol}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'accion',
      header: 'Acción',
      cell: ({ getValue }) => {
        const accion = getValue() as string;
        const config = ACCION_CONFIG[accion];
        if (!config) return <span className="text-sm">{accion}</span>;
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'entidad',
      header: 'Entidad',
      cell: ({ getValue }) => {
        const entidad = getValue() as string;
        const config = ENTIDAD_CONFIG[entidad];
        return (
          <Badge variant={config?.badge || 'default'}>
            {config?.label || entidad}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'entidadId',
      header: 'ID',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-600">
            {v.slice(0, 8)}
          </code>
        ) : '—';
      },
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      cell: ({ getValue }) => {
        const ip = getValue() as string;
        return ip ? (
          <span className="font-mono text-xs text-gray-500">{ip}</span>
        ) : '—';
      },
    },
    {
      id: 'detalle',
      header: '',
      cell: ({ row }) => {
        const log = row.original;
        const hasChanges = log.datosAnteriores || log.datosNuevos;
        if (!hasChanges) return null;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedLog(selectedLog?.id === log.id ? null : log); }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Ver cambios"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        );
      },
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Registro de Auditoría</h3>
            <p className="text-xs text-gray-500">
              {auditMeta.total} registro{auditMeta.total !== 1 ? 's' : ''} en total
            </p>
          </div>
        </div>
        <button
          onClick={fetchAuditLogs}
          disabled={auditLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuario, IP..."
            value={auditFilters.search}
            onChange={(e) => { setAuditFilters({ ...auditFilters, search: e.target.value }); setAuditPage(1); }}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 sm:block hidden" />
          <select
            value={auditFilters.entidad}
            onChange={(e) => { setAuditFilters({ ...auditFilters, entidad: e.target.value }); setAuditPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            <option value="">Todas las entidades</option>
            {Object.entries(ENTIDAD_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={auditFilters.accion}
            onChange={(e) => { setAuditFilters({ ...auditFilters, accion: e.target.value }); setAuditPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ACCION_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg px-2 py-2 text-xs font-medium text-purple-600 hover:bg-purple-50"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla — solo desktop */}
      <div className="mt-4 hidden lg:block">
        <DataTable
          data={auditLogs}
          columns={auditColumns}
          loading={auditLoading}
          page={auditPage}
          totalPages={auditMeta.totalPages}
          total={auditMeta.total}
          onPageChange={setAuditPage}
          emptyMessage="No hay registros de auditoría"
          exportable
          exportFilename="auditoria"
          striped
          compact
        />
      </div>

      {/* Panel de detalle de cambios */}
      {selectedLog && (
        <div className="mt-4 overflow-hidden rounded-xl border border-purple-200 bg-purple-50/50">
          <div className="flex items-center justify-between border-b border-purple-200 bg-purple-100/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">Detalle de cambios</span>
              <code className="rounded bg-purple-200/50 px-1.5 py-0.5 text-xs text-purple-700">
                {selectedLog.entidad} · {selectedLog.entidadId?.slice(0, 8)}
              </code>
            </div>
            <button onClick={() => setSelectedLog(null)} className="text-xs text-purple-500 hover:text-purple-700">
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            {selectedLog.datosAnteriores && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-600">Antes</p>
                <pre className="overflow-auto rounded-lg bg-white p-3 text-xs text-gray-700 shadow-inner">
                  {JSON.stringify(selectedLog.datosAnteriores, null, 2)}
                </pre>
              </div>
            )}
            {selectedLog.datosNuevos && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">Después</p>
                <pre className="overflow-auto rounded-lg bg-white p-3 text-xs text-gray-700 shadow-inner">
                  {JSON.stringify(selectedLog.datosNuevos, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile card view */}
      <div className="mt-4 space-y-3 lg:hidden">
        {auditLoading && (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-purple-400" />
          </div>
        )}
        {!auditLoading && auditLogs.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No hay registros de auditoría</p>
        )}
        {!auditLoading && auditLogs.map((log) => {
          const accionCfg = ACCION_CONFIG[log.accion];
          const entidadCfg = ENTIDAD_CONFIG[log.entidad];
          const AccionIcon = accionCfg?.icon || FileText;
          return (
            <div key={log.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${accionCfg?.bg || 'bg-gray-100'} ${accionCfg?.color || 'text-gray-700'}`}>
                    <AccionIcon className="h-3 w-3" />
                    {accionCfg?.label || log.accion}
                  </span>
                  <Badge variant={entidadCfg?.badge || 'default'}>
                    {entidadCfg?.label || log.entidad}
                  </Badge>
                </div>
                <span className="text-[11px] text-gray-400">
                  {log.createdAt ? formatFechaConHora(log.createdAt) : '—'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{log.usuario?.nombre || 'Sistema'}</span>
                {log.ip && <span className="font-mono text-xs text-gray-400">· {log.ip}</span>}
              </div>
              {log.entidadId && (
                <code className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                  ID: {log.entidadId.slice(0, 8)}
                </code>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
