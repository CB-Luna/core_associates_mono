'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { type AuditoriaRecord } from '@/lib/api-types';
import { type PaginatedResponse } from '@/lib/api-client';

export function AuditoriaTab() {
  const [auditLogs, setAuditLogs] = useState<AuditoriaRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditMeta, setAuditMeta] = useState({ total: 0, totalPages: 1 });
  const [auditFilters, setAuditFilters] = useState({ entidad: '', accion: '', search: '' });

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

  const auditColumns: ColumnDef<AuditoriaRecord, unknown>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ getValue }) => {
        const v = getValue();
        return v ? new Date(v as string).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—';
      },
    },
    {
      id: 'usuarioNombre',
      header: 'Usuario',
      cell: ({ row }) => row.original.usuario?.nombre || '—',
    },
    { accessorKey: 'accion', header: 'Acción' },
    { accessorKey: 'entidad', header: 'Entidad' },
    {
      accessorKey: 'entidadId',
      header: 'ID Entidad',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? <span className="font-mono text-xs">{v.slice(0, 8)}…</span> : '—';
      },
    },
    { accessorKey: 'ip', header: 'IP' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Registro de auditoria</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar..."
          value={auditFilters.search}
          onChange={(e) => { setAuditFilters({ ...auditFilters, search: e.target.value }); setAuditPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={auditFilters.entidad}
          onChange={(e) => { setAuditFilters({ ...auditFilters, entidad: e.target.value }); setAuditPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todas las entidades</option>
          <option value="asociado">Asociado</option>
          <option value="cupon">Cupon</option>
          <option value="promocion">Promocion</option>
          <option value="proveedor">Proveedor</option>
          <option value="caso_legal">Caso Legal</option>
          <option value="documento">Documento</option>
          <option value="usuario">Usuario</option>
        </select>
        <select
          value={auditFilters.accion}
          onChange={(e) => { setAuditFilters({ ...auditFilters, accion: e.target.value }); setAuditPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todas las acciones</option>
          <option value="crear">Crear</option>
          <option value="actualizar">Actualizar</option>
          <option value="eliminar">Eliminar</option>
          <option value="cambio_estado">Cambio de estado</option>
          <option value="login">Login</option>
        </select>
      </div>
      <div className="mt-4">
        <DataTable
          data={auditLogs}
          columns={auditColumns}
          loading={auditLoading}
          page={auditPage}
          totalPages={auditMeta.totalPages}
          total={auditMeta.total}
          onPageChange={setAuditPage}
          emptyMessage="No hay registros de auditoria"
          exportable
          exportFilename="auditoria"
          striped
          compact
        />
      </div>
    </div>
  );
}
