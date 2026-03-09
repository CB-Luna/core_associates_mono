import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SearchToolbar } from '@/components/ui/SearchToolbar';

describe('SearchToolbar', () => {
  it('should render search input with placeholder', () => {
    render(<SearchToolbar placeholder="Buscar asociados..." onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText('Buscar asociados...')).toBeInTheDocument();
  });

  it('should call onSearch when form is submitted', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchToolbar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Juan{enter}');
    expect(onSearch).toHaveBeenCalledWith('Juan');
  });

  it('should render filter dropdown when filterOptions provided', () => {
    const options = [
      { label: 'Todos', value: '' },
      { label: 'Activo', value: 'activo' },
      { label: 'Pendiente', value: 'pendiente' },
    ];
    render(
      <SearchToolbar
        onSearch={vi.fn()}
        filterOptions={options}
        filterValue=""
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('should call onFilterChange when filter changes', async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    const options = [
      { label: 'Todos', value: '' },
      { label: 'Activo', value: 'activo' },
    ];
    render(
      <SearchToolbar
        onSearch={vi.fn()}
        filterOptions={options}
        filterValue=""
        onFilterChange={onFilterChange}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox'), 'activo');
    expect(onFilterChange).toHaveBeenCalledWith('activo');
  });

  it('should render action button when actionLabel provided', () => {
    render(
      <SearchToolbar
        onSearch={vi.fn()}
        actionLabel="Nuevo Asociado"
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /nuevo asociado/i })).toBeInTheDocument();
  });

  it('should call onAction when action button clicked', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchToolbar
        onSearch={vi.fn()}
        actionLabel="Crear"
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: /crear/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should not render filter or action button when not provided', () => {
    render(<SearchToolbar onSearch={vi.fn()} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
