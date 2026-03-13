'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Tag, Ticket, Pencil, Trash2, MapPin, Upload, ImageIcon } from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import { formatFechaLegible } from '@/lib/utils';
import type { Proveedor } from '@/lib/api-types';
import { Badge, estadoProveedorVariant, tipoProveedorVariant } from '@/components/ui/Badge';
import { ProveedorFormDialog } from '@/components/shared/ProveedorFormDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MapView } from '@/components/ui/MapView';
import { usePermisos } from '@/lib/permisos';

export default function ProveedorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { puede } = usePermisos();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchData = () => {
    setLoading(true);
    apiClient<Proveedor>(`/proveedores/${id}`)
      .then((p) => {
        setProveedor(p);
        if (p.logotipoUrl) {
          apiImageUrl(`/proveedores/${id}/logotipo`).then(setLogoUrl).catch(() => setLogoUrl(null));
        } else {
          setLogoUrl(null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient(`/proveedores/${id}`, { method: 'DELETE' });
      router.push('/proveedores');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await apiClient(`/proveedores/${id}/logotipo`, { method: 'POST', body: fd });
      const url = await apiImageUrl(`/proveedores/${id}/logotipo`);
      setLogoUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir logotipo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  if (!proveedor) {
    return <p className="text-gray-500">Proveedor no encontrado</p>;
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Logotipo */}
          <div className="relative group flex-shrink-0">
            <div className="h-16 w-16 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Logotipo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-300" />
              )}
            </div>
            {puede('editar:proveedores') && (
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingLogo ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Upload className="h-5 w-5 text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{proveedor.razonSocial}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{proveedor.idUnico}</span>
              <Badge variant={tipoProveedorVariant[proveedor.tipo]}>{proveedor.tipo}</Badge>
              <Badge variant={estadoProveedorVariant[proveedor.estado]}>{proveedor.estado}</Badge>
            </div>
          </div>
        </div>
        {puede('editar:proveedores') && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
            {puede('eliminar:proveedores') && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Información de Contacto</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Contacto</dt>
              <dd className="text-gray-900 dark:text-gray-200">{proveedor.contactoNombre || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Teléfono</dt>
              <dd className="text-gray-900 dark:text-gray-200">{proveedor.telefono || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-gray-900 dark:text-gray-200">{proveedor.email || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Dirección</dt>
              <dd className="text-gray-900 dark:text-gray-200">{proveedor.direccion || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Stats */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Estadísticas</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Cupones Emitidos</dt>
              <dd className="text-gray-900 font-medium dark:text-gray-200">{proveedor._count?.cuponesEmitidos || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Cupones Canjeados</dt>
              <dd className="text-gray-900 font-medium dark:text-gray-200">{proveedor._count?.cuponesCanjeados || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Promociones</dt>
              <dd className="text-gray-900 font-medium dark:text-gray-200">{proveedor._count?.promociones || proveedor.promociones?.length || 0}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Promotions */}
      {proveedor.promociones && proveedor.promociones.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <Tag className="h-4 w-4" />
            Promociones ({proveedor.promociones.length})
          </h3>
          <div className="mt-3 space-y-3">
            {proveedor.promociones.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{p.titulo}</p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {p.tipoDescuento === 'porcentaje' ? `${p.valorDescuento}%` : `$${p.valorDescuento}`}
                    {' · '}
                    {formatFechaLegible(p.fechaInicio)} - {formatFechaLegible(p.fechaFin)}
                  </p>
                </div>
                <Badge
                  variant={p.estado === 'activa' ? 'success' : p.estado === 'pausada' ? 'warning' : 'default'}
                >
                  {p.estado}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <ProveedorFormDialog
          proveedor={proveedor}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            fetchData();
          }}
        />
      )}

      {/* Map */}
      {proveedor.latitud && proveedor.longitud && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <MapPin className="h-4 w-4" />
            Ubicación
          </h3>
          <div className="mt-3">
            <MapView
              markers={[{
                lat: proveedor.latitud,
                lng: proveedor.longitud,
                label: proveedor.razonSocial,
                popup: proveedor.direccion || undefined,
              }]}
              height="300px"
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Eliminar proveedor"
        message={`¿Estás seguro de eliminar a "${proveedor.razonSocial}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
