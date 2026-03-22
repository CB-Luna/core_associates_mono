'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, apiImageUrl, type PaginatedResponse } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import type { AbogadoCRM } from '@/lib/api-types';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge, estadoProveedorVariant } from '@/components/ui/Badge';
import { formatFechaLegible } from '@/lib/utils';
import { Eye, Mail, Briefcase, Scale, Clock, Plus, Gavel, Car, Building2, HardHat, Heart, TrendingUp } from 'lucide-react';
import { NuevoAbogadoDialog } from './NuevoAbogadoDialog';

function AbogadoAvatar({ abogado }: { abogado: AbogadoCRM }) {
  const [src, setSrc] = useState<string | null>(null);
  const initials = abogado.nombre?.substring(0, 2).toUpperCase() || 'AB';

  useEffect(() => {
    if (!abogado.avatarUrl) return;
    let revoked = false;
    apiImageUrl(`/auth/users/${abogado.id}/avatar`)
      .then((url) => { if (!revoked) setSrc(url); })
      .catch(() => {});
    return () => { revoked = true; if (src) URL.revokeObjectURL(src); };
  }, [abogado.id, abogado.avatarUrl]);

  if (src) {
    return <img src={src} alt={initials} className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" />;
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-xs font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

const estadoOptions = [
  { label: 'Activo', value: 'activo' },
  { label: 'Inactivo', value: 'inactivo' },
];

const especialidadLabels: Record<string, string> = {
  penal: 'Penal',
  civil: 'Civil',
  mercantil: 'Mercantil',
  laboral: 'Laboral',
  administrativo: 'Administrativo',
  transito: 'Tránsito',
  familiar: 'Familiar',
};

const especialidadIconos: Record<string, React.ReactNode> = {
  penal: <Gavel className="h-3 w-3" />,
  civil: <Scale className="h-3 w-3" />,
  mercantil: <TrendingUp className="h-3 w-3" />,
  laboral: <HardHat className="h-3 w-3" />,
  administrativo: <Building2 className="h-3 w-3" />,
  transito: <Car className="h-3 w-3" />,
  familiar: <Heart className="h-3 w-3" />,
};

export default function AbogadosPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<AbogadoCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, activos: 0, conCasosActivos: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (estadoFilter) params.set('estado', estadoFilter);

      const res = await apiClient<PaginatedResponse<AbogadoCRM>>(`/auth/users/abogados?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);

      // Calcular stats del resultado completo (primera carga)
      if (!search && !estadoFilter && page === 1) {
        const activos = res.data.filter(a => a.estado === 'activo').length;
        const conCasos = res.data.filter(a => {
          const activas = (a.casosBreakdown?.abierto ?? 0) + (a.casosBreakdown?.en_atencion ?? 0) + (a.casosBreakdown?.escalado ?? 0);
          return activas > 0;
        }).length;
        setStats({ total: res.meta.total, activos, conCasosActivos: conCasos });
      }
    } catch (err: any) {
      toast('error', 'Error', err.message || 'No se pudieron cargar los abogados');
    } finally {
      setLoading(false);
    }
  }, [page, search, estadoFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: ColumnDef<AbogadoCRM, any>[] = [
    {
      id: 'abogado',
      header: 'Abogado',
      meta: { exportValue: (a: AbogadoCRM) => a.nombre },
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-3">
            <AbogadoAvatar abogado={a} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{a.nombre}</p>
              <p className="truncate text-xs text-gray-400">{a.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'especialidad',
      header: 'Especialidad',
      cell: ({ getValue }) => {
        const val = getValue() as string | null;
        if (!val) return <span className="text-xs text-gray-300">Sin asignar</span>;
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            {especialidadIconos[val] ?? <Briefcase className="h-3 w-3" />}
            {especialidadLabels[val] || val}
          </span>
        );
      },
    },
    {
      id: 'casosActivos',
      header: 'Casos Activos',
      meta: {
        exportValue: (a: AbogadoCRM) => {
          const activas = (a.casosBreakdown?.abierto ?? 0) + (a.casosBreakdown?.en_atencion ?? 0) + (a.casosBreakdown?.escalado ?? 0);
          return activas;
        },
      },
      cell: ({ row }) => {
        const b = row.original.casosBreakdown || {};
        const activas = (b.abierto ?? 0) + (b.en_atencion ?? 0) + (b.escalado ?? 0);
        const totalCasos = row.original._count?.casosComoAbogado ?? 0;
        return (
          <div className="flex items-center gap-2">
            <Scale className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-sm font-semibold text-gray-900">{activas}</span>
            <span className="text-xs text-gray-400">/ {totalCasos} total</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return <Badge variant={estadoProveedorVariant[estado] || 'default'}>{estado}</Badge>;
      },
    },
    {
      accessorKey: 'ultimoAcceso',
      header: 'Último Acceso',
      cell: ({ getValue }) => {
        const val = getValue() as string | null;
        if (!val) return <span className="text-xs text-gray-300">Nunca</span>;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="h-3 w-3 text-gray-400" />
            {formatFechaLegible(val)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/abogados/${row.original.id}`); }}
            title="Ver detalle"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200 text-violet-500 transition-colors hover:bg-violet-50 hover:text-violet-700"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Abogados</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Gestión de abogados y asignación de casos legales</p>
      </div>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Total', value: stats.total, color: 'blue' },
          { title: 'Activos', value: stats.activos, color: 'green' },
          { title: 'Con Casos Activos', value: stats.conCasosActivos, color: 'orange' },
        ]}
      />

      <div className="mt-6">
        <SearchToolbar
          placeholder="Buscar por nombre, email o especialidad..."
          onSearch={handleSearch}
          filterOptions={estadoOptions}
          filterValue={estadoFilter}
          onFilterChange={(v) => {
            setEstadoFilter(v);
            setPage(1);
          }}
          actionLabel="Nuevo Abogado"
          actionIcon={<Plus className="h-4 w-4" />}
          onAction={() => setShowCreateDialog(true)}
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
          exportFilename="abogados"
          striped
          cardRenderer={(a: AbogadoCRM) => {
            const b = a.casosBreakdown || {};
            const activas = (b.abierto ?? 0) + (b.en_atencion ?? 0) + (b.escalado ?? 0);
            return (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <AbogadoAvatar abogado={a} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{a.nombre}</p>
                      <p className="truncate text-xs text-gray-400">{a.email}</p>
                    </div>
                    <Badge variant={estadoProveedorVariant[a.estado] || 'default'}>{a.estado}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    {a.especialidad && (
                      <span className="inline-flex items-center gap-1">
                        {especialidadIconos[a.especialidad] ?? <Briefcase className="h-3 w-3" />}
                        {especialidadLabels[a.especialidad] || a.especialidad}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Scale className="h-3 w-3" />
                      {activas} activos / {a._count?.casosComoAbogado ?? 0} total
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/abogados/${a.id}`); }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-violet-200 text-violet-500 hover:bg-violet-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {showCreateDialog && (
        <NuevoAbogadoDialog
          onClose={() => setShowCreateDialog(false)}
          onSaved={() => { fetchData(); }}
        />
      )}
    </div>
  );
}
