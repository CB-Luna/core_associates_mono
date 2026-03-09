import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface TestRow {
  id: string;
  nombre: string;
  estado: string;
}

const columns: ColumnDef<TestRow, string>[] = [
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'estado', header: 'Estado' },
];

const mockData: TestRow[] = [
  { id: '1', nombre: 'Juan Pérez', estado: 'activo' },
  { id: '2', nombre: 'María López', estado: 'pendiente' },
];

describe('DataTable', () => {
  it('should render column headers', () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('should render data rows', () => {
    render(<DataTable data={mockData} columns={columns} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('should show empty message when no data', () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="Sin resultados" />);
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('should show default empty message', () => {
    render(<DataTable data={[]} columns={columns} />);
    expect(screen.getByText(/no se encontraron registros/i)).toBeInTheDocument();
  });

  it('should show loading skeleton when loading is true', () => {
    const { container } = render(<DataTable data={[]} columns={columns} loading />);
    const skeletonRows = container.querySelectorAll('.animate-pulse');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('should call onRowClick when a data row is clicked', async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    render(<DataTable data={mockData} columns={columns} onRowClick={onRowClick} />);

    await user.click(screen.getByText('Juan Pérez'));
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Juan Pérez' }));
  });

  it('should render pagination when totalPages > 1', () => {
    render(
      <DataTable
        data={mockData}
        columns={columns}
        page={1}
        totalPages={3}
        total={30}
        onPageChange={vi.fn()}
      />,
    );
    // Page buttons exist (use getAllByRole to avoid duplicate '1' in info text)
    const pageButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent === '2' || btn.textContent === '3',
    );
    expect(pageButtons).toHaveLength(2);
  });

  it('should call onPageChange when page button is clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockData}
        columns={columns}
        page={1}
        totalPages={3}
        total={30}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByText('2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
