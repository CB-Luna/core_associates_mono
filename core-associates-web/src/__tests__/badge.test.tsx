import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, estadoAsociadoVariant, estadoProveedorVariant } from '@/components/ui/Badge';

describe('Badge', () => {
  it('should render children text', () => {
    render(<Badge>Activo</Badge>);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('should apply default variant classes when no variant specified', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-gray-50', 'text-gray-600');
  });

  it('should apply success variant classes', () => {
    render(<Badge variant="success">OK</Badge>);
    const badge = screen.getByText('OK');
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('should apply danger variant classes', () => {
    render(<Badge variant="danger">Error</Badge>);
    const badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-red-50', 'text-red-700');
  });

  it('should apply warning variant classes', () => {
    render(<Badge variant="warning">Pendiente</Badge>);
    const badge = screen.getByText('Pendiente');
    expect(badge).toHaveClass('bg-amber-50', 'text-amber-700');
  });

  it('should accept custom className', () => {
    render(<Badge className="ml-2">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('ml-2');
  });

  it('should render as a span element', () => {
    render(<Badge>Span</Badge>);
    const badge = screen.getByText('Span');
    expect(badge.tagName).toBe('SPAN');
  });
});

describe('estadoAsociadoVariant', () => {
  it('should map activo to success', () => {
    expect(estadoAsociadoVariant['activo']).toBe('success');
  });

  it('should map pendiente to warning', () => {
    expect(estadoAsociadoVariant['pendiente']).toBe('warning');
  });

  it('should map suspendido to danger', () => {
    expect(estadoAsociadoVariant['suspendido']).toBe('danger');
  });
});

describe('estadoProveedorVariant', () => {
  it('should map activo to success', () => {
    expect(estadoProveedorVariant['activo']).toBe('success');
  });

  it('should map inactivo to default', () => {
    expect(estadoProveedorVariant['inactivo']).toBe('default');
  });
});
