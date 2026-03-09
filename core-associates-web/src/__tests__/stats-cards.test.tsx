import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatsCards } from '@/components/ui/StatsCards';

describe('StatsCards', () => {
  const mockCards = [
    { title: 'Total Asociados', value: 150, color: 'blue' as const },
    { title: 'Proveedores', value: 25, color: 'green' as const, subtitle: '+3 este mes' },
    { title: 'Cupones Activos', value: '1,234', color: 'purple' as const },
  ];

  it('should render all stat cards', () => {
    render(<StatsCards cards={mockCards} />);
    expect(screen.getByText('Total Asociados')).toBeInTheDocument();
    expect(screen.getByText('Proveedores')).toBeInTheDocument();
    expect(screen.getByText('Cupones Activos')).toBeInTheDocument();
  });

  it('should display values', () => {
    render(<StatsCards cards={mockCards} />);
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('should display subtitle when provided', () => {
    render(<StatsCards cards={mockCards} />);
    expect(screen.getByText('+3 este mes')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<StatsCards cards={mockCards} className="mt-4" />);
    expect(container.firstChild).toHaveClass('mt-4');
  });

  it('should render empty when no cards', () => {
    const { container } = render(<StatsCards cards={[]} />);
    expect(container.firstChild?.childNodes).toHaveLength(0);
  });
});
