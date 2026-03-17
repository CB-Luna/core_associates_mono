'use client';

import { useEffect, useState } from 'react';
import { apiImageUrl } from '@/lib/api-client';
import { Car } from 'lucide-react';

interface Props {
  vehiculoId: string;
  fotoUrl: string | null;
  size?: 'sm' | 'md';
}

export function VehiclePhoto({ vehiculoId, fotoUrl, size = 'sm' }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!fotoUrl) { setSrc(null); return; }
    let revoked = false;
    apiImageUrl(`/vehiculos/${vehiculoId}/foto`)
      .then((url) => { if (!revoked) setSrc(url); })
      .catch(() => {});
    return () => { revoked = true; if (src) URL.revokeObjectURL(src); };
  }, [vehiculoId, fotoUrl]);

  const dims = size === 'md' ? 'h-14 w-14' : 'h-10 w-10';
  const iconSize = size === 'md' ? 'h-6 w-6' : 'h-5 w-5';

  if (src) {
    return <img src={src} alt="Vehículo" className={`${dims} rounded-lg object-cover`} />;
  }

  return (
    <div className={`flex ${dims} items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400`}>
      <Car className={iconSize} />
    </div>
  );
}
