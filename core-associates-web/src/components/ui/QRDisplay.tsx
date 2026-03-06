'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRDisplay({ value, size = 180, className = '' }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    }).catch(console.error);
  }, [value, size]);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <canvas ref={canvasRef} className="rounded-lg" />
    </div>
  );
}
