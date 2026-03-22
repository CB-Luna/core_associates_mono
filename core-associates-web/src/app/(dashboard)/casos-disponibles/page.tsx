'use client';

import { useEffect, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { formatFechaLegible } from '@/lib/utils';
import { Car, Gavel, ShieldAlert, AlertTriangle, HelpCircle, Calendar, Hand, MapPin, X, User } from 'lucide-react';
import type { CasoLegal } from '@/lib/api-types';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/ui/MapView').then((m) => m.MapView), { ssr: false });

const tipoIcon: Record<string, typeof AlertTriangle> = {
  accidente: Car, infraccion: Gavel, robo: ShieldAlert, asalto: AlertTriangle, otro: HelpCircle,
};
const tipoColorBg: Record<string, string> = {
  accidente: 'bg-red-50 text-red-500', infraccion: 'bg-amber-50 text-amber-500', robo: 'bg-purple-50 text-purple-500',
  asalto: 'bg-orange-50 text-orange-500', otro: 'bg-gray-50 text-gray-400',
};
const prioridadVariant: Record<string, any> = {
  urgente: 'danger', alta: 'danger', media: 'warning', baja: 'info',
};

export default function CasosDisponiblesPage() {
  const [data, setData] = useState<CasoLegal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  // Postularse confirm
  const [postulando, setPostulando] = useState(false);
  const [confirmCase, setConfirmCase] = useState<{ open: boolean; casoId: string; codigo: string }>({ open: false, casoId: '', codigo: '' });
  const [mapModal, setMapModal] = useState<{ open: boolean; lat: number; lng: number; label: string }>({ open: false, lat: 0, lng: 0, label: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      const res = await apiClient<PaginatedResponse<CasoLegal>>(`/casos-legales/abogado/disponibles?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePostularse = async () => {
    setPostulando(true);
    try {
      await apiClient(`/casos-legales/${confirmCase.casoId}/postularse`, { method: 'POST' });
      toast('success', 'Postulación enviada', 'Un operador revisará tu solicitud');
      fetchData();
    } catch (err: any) {
      toast('error', 'Error', err.message);
    } finally {
      setPostulando(false);
      setConfirmCase({ open: false, casoId: '', codigo: '' });
    }
  };

  const columns: ColumnDef<CasoLegal, any>[] = [
    {
      id: 'caso',
      header: 'Caso',
      cell: ({ row }) => {
        const c = row.original;
        const TIcon = tipoIcon[c.tipoPercance] || HelpCircle;
        return (
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tipoColorBg[c.tipoPercance] || 'bg-gray-50 text-gray-400'}`}>
              <TIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-bold text-gray-700">{c.codigo}</p>
              <p className="truncate text-[11px] capitalize text-gray-400">{c.tipoPercance}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'asociado',
      header: 'Asociado',
      cell: ({ row }) => {
        const a = row.original.asociado;
        if (!a) return <span className="text-gray-300">—</span>;
        return (
          <div className="flex items-center gap-2">
            {a.fotoUrl ? (
              <img src={a.fotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
            <span className="truncate text-sm font-medium text-gray-800">{a.nombre} {a.apellidoPat}</span>
          </div>
        );
      },
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => (
        <span className="truncate text-sm text-gray-600">{row.original.descripcion || '—'}</span>
      ),
    },
    {
      accessorKey: 'prioridad',
      header: 'Prioridad',
      cell: ({ getValue }) => <Badge variant={prioridadVariant[getValue() as string] || 'default'}>{getValue() as string}</Badge>,
    },
    {
      id: 'ubicacion',
      header: 'Ubicación',
      cell: ({ row }) => {
        const c = row.original;
        if (!c.latitud || !c.longitud) return <span className="text-gray-300">—</span>;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setMapModal({ open: true, lat: c.latitud, lng: c.longitud, label: c.codigo }); }}
            title={c.direccionAprox || 'Ver mapa'}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-50 hover:text-primary-600"
          >
            <MapPin className="h-3.5 w-3.5" /> Mapa
          </button>
        );
      },
    },
    {
      accessorKey: 'fechaApertura',
      header: 'Apertura',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatFechaLegible(getValue() as string)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmCase({ open: true, casoId: row.original.id, codigo: row.original.codigo });
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700"
        >
          <Hand className="h-3.5 w-3.5" /> Postularme
        </button>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Casos Disponibles</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Casos legales sin abogado asignado · {total} disponible{total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mt-6">
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          striped
        />
      </div>

      <ConfirmDialog
        open={confirmCase.open}
        onCancel={() => setConfirmCase({ open: false, casoId: '', codigo: '' })}
        onConfirm={handlePostularse}
        title="Postularse al caso"
        message={`¿Deseas postularte para atender el caso ${confirmCase.codigo}? Un operador revisará tu solicitud.`}
        confirmLabel="Postularme"
        loading={postulando}
      />

      {/* Mini-mapa modal */}
      {mapModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMapModal((m) => ({ ...m, open: false }))}>
          <div className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMapModal((m) => ({ ...m, open: false }))}
              className="absolute right-3 top-3 z-10 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Ubicación — {mapModal.label}</h3>
            <div className="h-72 rounded-lg overflow-hidden">
              <MapView center={[mapModal.lat, mapModal.lng]} markers={[{ lat: mapModal.lat, lng: mapModal.lng, label: mapModal.label }]} zoom={15} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
