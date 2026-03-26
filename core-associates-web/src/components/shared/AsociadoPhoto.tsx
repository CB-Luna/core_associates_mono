'use client';

import { useEffect, useState } from 'react';
import { apiImageUrl } from '@/lib/api-client';

type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<Size, { container: string; text: string }> = {
  sm: { container: 'h-7 w-7', text: 'text-[10px]' },
  md: { container: 'h-9 w-9', text: 'text-xs' },
  lg: { container: 'h-14 w-14', text: 'text-base' },
};

interface Props {
  asociado: {
    id?: string;
    nombre?: string;
    apellidoPat?: string;
  };
  size?: Size;
  className?: string;
}

/**
 * Shared avatar for asociados. Always attempts to fetch the image from the
 * backend (which falls back to the approved selfie when there is no explicit
 * fotoUrl). Shows initials when the fetch fails or the id is missing.
 */
export function AsociadoPhoto({ asociado, size = 'md', className }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const initials = `${asociado.nombre?.[0] || ''}${asociado.apellidoPat?.[0] || ''}`.toUpperCase();
  const s = SIZE_CLASSES[size];

  useEffect(() => {
    if (!asociado.id) return;
    let revoked = false;
    apiImageUrl(`/asociados/${asociado.id}/foto`)
      .then((url) => { if (!revoked) setSrc(url); })
      .catch(() => {});
    return () => {
      revoked = true;
      setSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [asociado.id]);

  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        className={`${s.container} rounded-full object-cover ring-2 ring-white shadow-sm ${className || ''}`}
      />
    );
  }
  return (
    <div
      className={`flex ${s.container} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 ${s.text} font-bold text-white shadow-sm ${className || ''}`}
    >
      {initials}
    </div>
  );
}
