'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Tag, Ticket, Pencil } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { Proveedor } from '@/lib/api-types';
import { Badge, estadoProveedorVariant, tipoProveedorVariant } from '@/components/ui/Badge';
import { ProveedorFormDialog } from '@/components/shared/ProveedorFormDialog';
import { usePermisos } from '@/lib/permisos';

export default function ProveedorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { puede } = usePermisos();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    apiClient<Proveedor>(`/proveedores/${id}`)
      .then(setProveedor)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{proveedor.razonSocial}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-gray-500">{proveedor.idUnico}</span>
            <Badge variant={tipoProveedorVariant[proveedor.tipo]}>{proveedor.tipo}</Badge>
            <Badge variant={estadoProveedorVariant[proveedor.estado]}>{proveedor.estado}</Badge>
          </div>
        </div>
        {puede('editar:proveedores') && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Información de Contacto</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Contacto</dt>
              <dd className="text-gray-900">{proveedor.contactoNombre || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Teléfono</dt>
              <dd className="text-gray-900">{proveedor.telefono || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{proveedor.email || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Dirección</dt>
              <dd className="text-gray-900">{proveedor.direccion || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Stats */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Estadísticas</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Cupones Emitidos</dt>
              <dd className="text-gray-900 font-medium">{proveedor._count?.cuponesEmitidos || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Cupones Canjeados</dt>
              <dd className="text-gray-900 font-medium">{proveedor._count?.cuponesCanjeados || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Promociones</dt>
              <dd className="text-gray-900 font-medium">{proveedor._count?.promociones || proveedor.promociones?.length || 0}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Promotions */}
      {proveedor.promociones && proveedor.promociones.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Tag className="h-4 w-4" />
            Promociones ({proveedor.promociones.length})
          </h3>
          <div className="mt-3 space-y-3">
            {proveedor.promociones.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{p.titulo}</p>
                  <p className="text-gray-500">
                    {p.tipoDescuento === 'porcentaje' ? `${p.valorDescuento}%` : `$${p.valorDescuento}`}
                    {' · '}
                    {new Date(p.fechaInicio).toLocaleDateString('es-MX')} - {new Date(p.fechaFin).toLocaleDateString('es-MX')}
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
    </div>
  );
}
