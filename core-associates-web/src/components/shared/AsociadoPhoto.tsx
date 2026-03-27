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
    fotoUrl?: string | null;
    documentos?: Array<{ tipo: string; estado?: string }>;
  };
  size?: Size;
  className?: string;
  /** Override the default /asociados/{id}/foto endpoint (e.g. proxy for abogado) */
  photoEndpoint?: string;
}

// Module-level cache to avoid hammering the API with duplicate requests.
// string → blob URL (photo exists), null → confirmed no photo.
const photoCache = new Map<string, string | null>();

/**
 * Shared avatar for asociados. Fetches the image once per asociado ID (cached
 * in memory) so rendering 20 rows doesn't fire 20 simultaneous requests.
 * Shows initials when there is no photo or the id is missing.
 */
export function AsociadoPhoto({ asociado, size = 'md', className, photoEndpoint }: Props) {
  const cacheKey = photoEndpoint || asociado.id || '';
  const [src, setSrc] = useState<string | null>(() => {
    const cached = photoCache.get(cacheKey);
    return cached !== undefined ? (cached ?? null) : null;
  });
  const initials = `${asociado.nombre?.[0] || ''}${asociado.apellidoPat?.[0] || ''}`.toUpperCase();
  const s = SIZE_CLASSES[size];

  useEffect(() => {
    const key = photoEndpoint || asociado.id;
    if (!key) return;
    if (photoCache.has(key)) {
      setSrc(photoCache.get(key) ?? null);
      return;
    }

    // Skip fetch if we know there's no photo: fotoUrl is explicitly null
    // and no selfie document exists (avoids flooding the console with 404s).
    if (!photoEndpoint && asociado.fotoUrl === null) {
      const hasSelfie = Array.isArray(asociado.documentos) &&
        asociado.documentos.some(d => d.tipo === 'selfie' && d.estado !== 'rechazado');
      if (!hasSelfie) {
        photoCache.set(key, null);
        return;
      }
    }

    const endpoint = photoEndpoint || `/asociados/${asociado.id}/foto`;
    const ctrl = new AbortController();
    apiImageUrl(endpoint, { signal: ctrl.signal })
      .then((url) => {
        photoCache.set(key, url);
        setSrc(url);
      })
      .catch(() => {
        // Only cache the 404 result — not an abort (component unmounted)
        if (!ctrl.signal.aborted) photoCache.set(key, null);
      });
    return () => ctrl.abort();
  }, [asociado.id, photoEndpoint]);

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
