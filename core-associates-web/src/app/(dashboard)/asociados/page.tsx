'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, apiImageUrl, type PaginatedResponse } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import type { Asociado } from '@/lib/api-types';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge, estadoAsociadoVariant } from '@/components/ui/Badge';
import { formatFechaLegible } from '@/lib/utils';
import { AsociadoDetailModal } from '@/components/shared/AsociadoDetailModal';
import { Eye, Phone, Calendar, Car, CreditCard, ScanLine, Camera, FileText } from 'lucide-react';
import { usePermisos } from '@/lib/permisos';

function AsociadoPhoto({ asociado }: { asociado: Asociado }) {
  const [src, setSrc] = useState<string | null>(null);
  const initials = `${asociado.nombre?.[0] || ''}${asociado.apellidoPat?.[0] || ''}`.toUpperCase();

  useEffect(() => {
    if (!asociado.fotoUrl) return;
    let revoked = false;
    apiImageUrl(`/asociados/${asociado.id}/foto`)
      .then((url) => { if (!revoked) setSrc(url); })
      .catch(() => {});
    return () => { revoked = true; if (src) URL.revokeObjectURL(src); };
  }, [asociado.id, asociado.fotoUrl]);

  if (src) {
    return <img src={src} alt={initials} className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" />;
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

const estadoOptions = [
  { label: 'Activo', value: 'activo' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Suspendido', value: 'suspendido' },
  { label: 'Baja', value: 'baja' },
  { label: 'Rechazado', value: 'rechazado' },
];

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  ine_frente: <CreditCard className="h-4 w-4" />,
  ine_reverso: <ScanLine className="h-4 w-4" />,
  selfie: <Camera className="h-4 w-4" />,
  tarjeta_circulacion: <Car className="h-4 w-4" />,
};

const DOC_ESTADO_CLASSES: Record<string, string> = {
  aprobado: 'text-green-500 bg-green-50 ring-1 ring-green-200',
  pendiente: 'text-amber-500 bg-amber-50 ring-1 ring-amber-200',
  rechazado: 'text-red-500 bg-red-50 ring-1 ring-red-200',
};
const DOC_DEFAULT_CLASS = 'text-gray-300 bg-gray-50 ring-1 ring-gray-200';

export default function AsociadosPage() {
  const { toast } = useToast();
  const { puede } = usePermisos();
  const router = useRouter();
  const [data, setData] = useState<Asociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, activos: 0, pendientes: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search) params.set('search', search);
      if (estadoFilter) params.set('estado', estadoFilter);

      const res = await apiClient<PaginatedResponse<Asociado>>(`/asociados?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'No se pudieron cargar los asociados');
    } finally {
      setLoading(false);
    }
  }, [page, search, estadoFilter]);

  // Fetch stats once
  useEffect(() => {
    apiClient<any>('/reportes/dashboard')
      .then((m) => {
        setStats({
          total: m.asociados.total,
          activos: m.asociados.activos,
          pendientes: m.asociados.pendientes,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: ColumnDef<Asociado, any>[] = [
    {
      id: 'asociado',
      header: 'Asociado',
      meta: {
        exportValue: (a: Asociado) => `${a.nombre} ${a.apellidoPat} ${a.apellidoMat || ''}`.trim(),
      },
      cell: ({ row }) => {
        const a = row.original;
        const fullName = `${a.nombre} ${a.apellidoPat} ${a.apellidoMat || ''}`.trim();
        return (
          <div className="flex items-center gap-3">
            <AsociadoPhoto asociado={a} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{fullName}</p>
              <p className="truncate font-mono text-[11px] text-gray-400">{a.idUnico}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          <Phone className="h-3 w-3" />{getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return (
          <Badge variant={estadoAsociadoVariant[estado] || 'default'}>
            {estado}
          </Badge>
        );
      },
    },
    {
      id: 'documentos',
      header: 'Documentos',
      meta: {
        exportValue: (a: Asociado) => {
          const tipos = ['ine_frente', 'ine_reverso', 'selfie', 'tarjeta_circulacion'] as const;
          return tipos.map(t => {
            const doc = a.documentos?.find(d => d.tipo === t);
            return `${t}: ${doc?.estado || 'sin enviar'}`;
          }).join(', ');
        },
      },
      cell: ({ row }) => {
        const docs = row.original.documentos || [];
        const tipos: { key: string; label: string }[] = [
          { key: 'ine_frente', label: 'INE Frente' },
          { key: 'ine_reverso', label: 'INE Reverso' },
          { key: 'selfie', label: 'Selfie' },
          { key: 'tarjeta_circulacion', label: 'T. Circulación' },
        ];
        return (
          <div className="flex items-center gap-1.5">
            {tipos.map(({ key, label }) => {
              const doc = docs.find((d: any) => d.tipo === key);
              const estado = doc?.estado;
              const title = `${label}: ${estado || 'Sin enviar'}`;
              const cls = estado ? DOC_ESTADO_CLASSES[estado] || DOC_DEFAULT_CLASS : DOC_DEFAULT_CLASS;
              return (
                <span key={key} title={title} className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${cls}`}>
                  {DOC_TYPE_ICONS[key] ?? <FileText className="h-4 w-4" />}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      id: 'vehiculos',
      header: 'Vehículos',
      meta: {
        exportValue: (a: Asociado) => {
          if (!a.vehiculos?.length) return 'Sin vehículos';
          return a.vehiculos.map(v => `${v.marca} ${v.modelo} (${v.placas})`).join(', ');
        },
      },
      cell: ({ row }) => {
        const vehs = row.original.vehiculos || [];
        const count = row.original._count?.vehiculos ?? vehs.length;
        if (count === 0) {
          return <span className="text-xs text-gray-300">—</span>;
        }
        const principal = vehs[0];
        return (
          <div className="flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-primary-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {principal ? `${principal.marca} ${principal.modelo}` : `${count}`}
              {count > 1 && <span className="ml-1 text-gray-400">+{count - 1}</span>}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'fechaRegistro',
      header: 'Registro',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatFechaLegible(getValue() as string)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        if (!puede('asociados:ver_detalle') && !puede('asociados:ver')) return null;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setDetailId(row.original.id); }}
              title="Ver detalle"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-200 text-primary-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:border-primary-800 dark:hover:bg-primary-950/30"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Asociados</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Gestión de conductores asociados</p>
      </div>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Total', value: stats.total, color: 'blue' },
          { title: 'Activos', value: stats.activos, color: 'green' },
          { title: 'Pendientes', value: stats.pendientes, color: 'orange' },
        ]}
      />

      <div className="mt-6">
        <SearchToolbar
          placeholder="Buscar por nombre, teléfono o ID..."
          onSearch={handleSearch}
          filterOptions={estadoOptions}
          filterValue={estadoFilter}
          onFilterChange={(v) => {
            setEstadoFilter(v);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-4">
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          columnToggle
          exportable
          exportFilename="asociados"
          selectable
          striped
          cardRenderer={(a: Asociado) => {
            const fullName = `${a.nombre} ${a.apellidoPat} ${a.apellidoMat || ''}`.trim();
            return (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <AsociadoPhoto asociado={a} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{fullName}</p>
                      <p className="font-mono text-[11px] text-gray-400">{a.idUnico}</p>
                    </div>
                    <Badge variant={estadoAsociadoVariant[a.estado] || 'default'}>{a.estado}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{a.telefono}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatFechaLegible(a.fechaRegistro)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {(['ine_frente','ine_reverso','selfie','tarjeta_circulacion'] as const).map(key => {
                        const doc = a.documentos?.find(d => d.tipo === key);
                        const estado = doc?.estado;
                        const cls = estado ? DOC_ESTADO_CLASSES[estado] || DOC_DEFAULT_CLASS : DOC_DEFAULT_CLASS;
                        return (
                          <span key={key} className={`inline-flex h-5 w-5 items-center justify-center rounded ${cls}`}>
                            {DOC_TYPE_ICONS[key] ?? <FileText className="h-3 w-3" />}
                          </span>
                        );
                      })}
                      {(a._count?.vehiculos ?? 0) > 0 && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-primary-500">
                          <Car className="h-3 w-3" />{a._count?.vehiculos}
                        </span>
                      )}
                    </div>
                    {(puede('asociados:ver_detalle') || puede('asociados:ver')) && (
                      <button onClick={(e) => { e.stopPropagation(); setDetailId(a.id); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary-200 text-primary-500 hover:bg-primary-50"><Eye className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {detailId && (
        <AsociadoDetailModal asociadoId={detailId} onClose={() => setDetailId(null)} onUpdated={fetchData} />
      )}
    </div>
  );
}
