'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Phone, Mail, MapPin, Calendar, Tag, ExternalLink } from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import type { Proveedor } from '@/lib/api-types';
import { Badge, estadoProveedorVariant, tipoProveedorVariant } from '@/components/ui/Badge';
import { formatFechaLegible } from '@/lib/utils';

interface Props {
  proveedorId: string;
  onClose: () => void;
}

export function ProveedorDetailModal({ proveedorId, onClose }: Props) {
  const router = useRouter();
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    apiClient<Proveedor>(`/proveedores/${proveedorId}`)
      .then((p) => {
        setProveedor(p);
        if (p.logotipoUrl) {
          apiImageUrl(`/proveedores/${proveedorId}/logotipo`).then(setLogoUrl).catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [proveedorId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 pt-[5vh]" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 p-5 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ) : proveedor ? (
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-14 w-14 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white">
                  {proveedor.razonSocial?.[0]?.toUpperCase() || 'P'}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{proveedor.razonSocial}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{proveedor.idUnico}</p>
              </div>
              <div className="ml-2 flex gap-1.5">
                <Badge variant={tipoProveedorVariant[proveedor.tipo]}>{proveedor.tipo}</Badge>
                <Badge variant={estadoProveedorVariant[proveedor.estado]}>{proveedor.estado}</Badge>
              </div>
            </div>
          ) : null}
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
          </div>
        ) : !proveedor ? (
          <div className="p-8 text-center text-gray-500">Proveedor no encontrado</div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto p-5">
            {/* Contact info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={Phone} label="Teléfono" value={proveedor.telefono || '—'} />
              <InfoRow icon={Mail} label="Email" value={proveedor.email || '—'} />
              <InfoRow icon={MapPin} label="Dirección" value={proveedor.direccion || '—'} />
              <InfoRow icon={Calendar} label="Contacto" value={proveedor.contactoNombre || '—'} />
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <StatCard label="Cupones Emitidos" value={proveedor._count?.cuponesEmitidos || 0} />
              <StatCard label="Cupones Canjeados" value={proveedor._count?.cuponesCanjeados || 0} />
              <StatCard label="Promociones" value={proveedor._count?.promociones || proveedor.promociones?.length || 0} />
            </div>

            {/* Promotions */}
            {proveedor.promociones && proveedor.promociones.length > 0 && (
              <div className="mt-5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Tag className="h-4 w-4 text-gray-500" />
                  Promociones ({proveedor.promociones.length})
                </h4>
                <div className="mt-2 space-y-2">
                  {proveedor.promociones.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{p.titulo}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {p.tipoDescuento === 'porcentaje' ? `${p.valorDescuento}%` : `$${p.valorDescuento}`}
                          {' · '}
                          {formatFechaLegible(p.fechaInicio)} - {formatFechaLegible(p.fechaFin)}
                        </p>
                      </div>
                      <Badge variant={p.estado === 'activa' ? 'success' : p.estado === 'pausada' ? 'warning' : 'default'}>
                        {p.estado}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {proveedor && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-700">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cerrar
            </button>
            <button
              onClick={() => { onClose(); router.push(`/proveedores/${proveedorId}`); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver detalle completo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-700/50">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <p className="truncate text-sm text-gray-900 dark:text-gray-200">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700/50">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
