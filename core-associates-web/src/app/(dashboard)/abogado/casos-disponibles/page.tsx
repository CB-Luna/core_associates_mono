'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatFechaLegible } from '@/lib/utils';
import { Eye, Car, Gavel, ShieldAlert, AlertTriangle, HelpCircle, MapPin, Settings } from 'lucide-react';
import type { CasoLegal, ZonaAbogado } from '@/lib/api-types';
import { AsociadoPhoto } from '@/components/shared/AsociadoPhoto';
import Link from 'next/link';

const tipoIcon: Record<string, typeof AlertTriangle> = {
  accidente: Car, infraccion: Gavel, robo: ShieldAlert, asalto: AlertTriangle, otro: HelpCircle,
};
const tipoColorBg: Record<string, string> = {
  accidente: 'bg-red-50 text-red-500', infraccion: 'bg-amber-50 text-amber-500',
  robo: 'bg-purple-50 text-purple-500', asalto: 'bg-orange-50 text-orange-500', otro: 'bg-gray-50 text-gray-400',
};
const prioridadVariant: Record<string, any> = {
  urgente: 'danger', alta: 'danger', media: 'warning', baja: 'info',
};

export default function CasosDisponiblesPage() {
  const router = useRouter();
  const [data, setData] = useState<CasoLegal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [zona, setZona] = useState<ZonaAbogado | null>(null);

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

  useEffect(() => {
    apiClient<ZonaAbogado>('/auth/me/zona').then(setZona).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
            <div>
              <p className="text-sm font-semibold text-neutral-800">{c.codigo}</p>
              <p className="text-xs text-neutral-500 capitalize">{c.tipoPercance.replace('_', ' ')}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'asociado',
      header: 'Asociado',
      cell: ({ row }) => {
        const as = row.original.asociado;
        if (!as) return <span className="text-neutral-400 text-sm">—</span>;
        return (
          <div className="flex items-center gap-2">
            <AsociadoPhoto asociado={{ id: as.id ?? row.original.asociadoId, nombre: as.nombre, apellidoPat: as.apellidoPat, fotoUrl: as.fotoUrl }} size="sm" />
            <p className="text-sm font-medium text-neutral-700">{as.nombre} {as.apellidoPat}</p>
          </div>
        );
      },
    },
    {
      id: 'distancia',
      header: 'Distancia',
      cell: ({ row }) => {
        const km = row.original.distanciaKm;
        if (km == null) return <span className="text-neutral-400 text-sm">—</span>;
        const color = km <= 10 ? 'text-green-600' : km <= 30 ? 'text-amber-600' : 'text-red-500';
        return (
          <div className={`flex items-center gap-1 text-sm font-semibold ${color}`}>
            <MapPin className="h-3.5 w-3.5" />
            {km} km
          </div>
        );
      },
    },
    {
      id: 'prioridad',
      header: 'Prioridad',
      cell: ({ row }) => (
        <Badge variant={prioridadVariant[row.original.prioridad] ?? 'default'}>
          {row.original.prioridad.charAt(0).toUpperCase() + row.original.prioridad.slice(1)}
        </Badge>
      ),
    },
    {
      id: 'ubicacion',
      header: 'Ubicación',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500 truncate max-w-[160px] block">
          {row.original.direccionAprox ?? `${row.original.latitud}, ${row.original.longitud}`}
        </span>
      ),
    },
    {
      id: 'fecha',
      header: 'Apertura',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600">{formatFechaLegible(row.original.fechaApertura)}</span>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/abogado/casos/${row.original.id}`)}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          <Eye className="h-4 w-4" />
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Casos Disponibles</h1>
          <p className="text-sm text-neutral-500 mt-1">Casos sin abogado asignado — postúlate para atenderlos</p>
        </div>
      </div>

      {!zona?.configurada && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Settings className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 flex-1">
            <strong>Sin zona configurada</strong> — se muestran todos los casos disponibles en la ciudad.
            Configura tu zona de operación para ver solo los más cercanos.
          </p>
          <Link href="/abogado/perfil" className="text-sm font-semibold text-amber-700 underline hover:text-amber-900">
            Configurar zona
          </Link>
        </div>
      )}

      {zona?.configurada && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <MapPin className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">
            Zona activa: <strong>{zona.zonaEstado ?? 'Sin nombre'}</strong> — radio {zona.zonaRadioKm ?? 80} km.
            Solo ves casos dentro de tu zona de operación.
          </p>
          <Link href="/abogado/perfil" className="text-sm font-semibold text-green-700 underline hover:text-green-900">
            Editar zona
          </Link>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        emptyMessage={zona?.configurada
          ? 'No hay casos disponibles en tu zona de operación'
          : 'No hay casos disponibles en este momento'
        }
        cardRenderer={(c: CasoLegal) => {
          const TIcon = tipoIcon[c.tipoPercance] || HelpCircle;
          const km = c.distanciaKm;
          const kmColor = km != null ? (km <= 10 ? 'text-green-600' : km <= 30 ? 'text-amber-600' : 'text-red-500') : '';
          return (
            <div
              className="px-4 py-3 active:bg-gray-50"
              onClick={() => router.push(`/abogado/casos/${c.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tipoColorBg[c.tipoPercance] || 'bg-gray-50 text-gray-400'}`}>
                  <TIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-800">{c.codigo}</p>
                    <Badge variant={prioridadVariant[c.prioridad] ?? 'default'}>
                      {c.prioridad.charAt(0).toUpperCase() + c.prioridad.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 capitalize mt-0.5">{c.tipoPercance.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  {c.asociado ? `${c.asociado.nombre} ${c.asociado.apellidoPat}` : '—'}
                </span>
                <div className="flex items-center gap-2">
                  {km != null && (
                    <span className={`flex items-center gap-0.5 font-semibold ${kmColor}`}>
                      <MapPin className="h-3 w-3" />
                      {km} km
                    </span>
                  )}
                  <span>{formatFechaLegible(c.fechaApertura)}</span>
                </div>
              </div>
              {c.direccionAprox && (
                <p className="mt-1 text-xs text-neutral-400 truncate">{c.direccionAprox}</p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
