'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
  success: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  secondary: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
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
