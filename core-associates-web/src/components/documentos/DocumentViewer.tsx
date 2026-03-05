'use client';

import { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export function DocumentViewer({ open, onClose, imageUrl, title }: DocumentViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!open) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80" onClick={onClose}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between bg-black/60 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-medium text-white">{title || 'Documento'}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            title="Alejar"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="min-w-[3rem] text-center text-sm text-white/70">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            title="Acercar"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={handleRotate}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            title="Rotar"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          <div className="mx-2 h-5 w-px bg-white/20" />
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="flex flex-1 items-center justify-center overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleReset}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title || 'Documento'}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
