'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  secondary: 'bg-purple-100 text-purple-700',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// Helpers for common status badges
export const estadoAsociadoVariant: Record<string, BadgeVariant> = {
  activo: 'success',
  pendiente: 'warning',
  suspendido: 'danger',
  baja: 'default',
  rechazado: 'danger',
};

export const estadoProveedorVariant: Record<string, BadgeVariant> = {
  activo: 'success',
  inactivo: 'default',
};

export const tipoProveedorVariant: Record<string, BadgeVariant> = {
  abogado: 'info',
  comida: 'warning',
  taller: 'secondary',
  lavado: 'info',
  capacitacion: 'success',
  otro: 'default',
};
