'use client';

import { useState, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  Search,
  SlidersHorizontal,
  Columns3,
  Check,
  Download,
  X,
} from 'lucide-react';

// ─── Props ───────────────────────────────────────────────────────────────────

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  /** Enable global search input */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Enable row selection with checkboxes */
  selectable?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (rows: T[]) => void;
  /** Enable column visibility toggle */
  columnToggle?: boolean;
  /** Enable CSV export button */
  exportable?: boolean;
  exportFilename?: string;
  /** Toolbar extras rendered after built-in controls */
  toolbarExtra?: React.ReactNode;
  /** Enable per-column filters */
  filterable?: boolean;
  /** Rows per page options for client-side pagination */
  pageSizeOptions?: number[];
  /** Enable striped rows */
  striped?: boolean;
  /** Compact row height */
  compact?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Custom card renderer for mobile view — receives each data row */
  cardRenderer?: (row: T) => React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generatePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function exportToCsv<T>(data: T[], columns: ColumnDef<T, any>[], filename: string) {
  const exportCols = columns.filter(
    (c) => {
      const id = (c as any).accessorKey || (c as any).id;
      return id && id !== 'actions' && id !== 'acciones' && id !== 'select';
    }
  );

  const headers = exportCols.map((c) => {
    const header = (c as any).header;
    return typeof header === 'string' ? header : ((c as any).accessorKey || (c as any).id || '');
  });

  const rows = data.map((row) =>
    exportCols.map((col) => {
      // 1. Custom export function via column meta
      const exportValue = (col as any).meta?.exportValue;
      if (typeof exportValue === 'function') {
        return escapeCsvField(exportValue(row));
      }
      // 2. Standard accessorKey
      const key = (col as any).accessorKey;
      if (key) return escapeCsvField((row as any)[key]);
      return '';
    })
  );

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Dropdown Component ──────────────────────────────────────────────────────

function Dropdown({ trigger, children, align = 'right' }: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className={`absolute z-40 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DataTable<T>({
  data,
  columns,
  loading = false,
  page = 1,
  totalPages = 1,
  total,
  onPageChange,
  onRowClick,
  emptyMessage = 'No se encontraron registros',
  searchable = false,
  searchPlaceholder = 'Buscar...',
  selectable = false,
  onSelectionChange,
  columnToggle = false,
  exportable = false,
  exportFilename = 'export',
  toolbarExtra,
  filterable = false,
  striped = false,
  compact = false,
  stickyHeader = false,
  cardRenderer,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Prepend selection column if selectable
  const finalColumns = useMemo(() => {
    if (!selectable) return columns;
    const selectCol: ColumnDef<T, any> = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
    return [selectCol, ...columns];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(next);
      if (onSelectionChange) {
        const selectedRows = Object.keys(next)
          .filter((k) => next[k])
          .map((k) => data[parseInt(k)])
          .filter(Boolean);
        onSelectionChange(selectedRows);
      }
    },
    enableRowSelection: selectable,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;
  const hasToolbar = searchable || columnToggle || exportable || toolbarExtra || selectedCount > 0;
  const cellPadding = compact ? 'px-4 py-2' : 'px-5 py-3.5';
  const headerPadding = compact ? 'px-4 py-2.5' : 'px-5 py-3.5';

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Mobile skeleton */}
        {cardRenderer && (
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Desktop skeleton */}
        <table className={`min-w-full ${cardRenderer ? 'hidden md:table' : ''}`}>
          <thead className="bg-gray-50/80 dark:bg-gray-800/80">
            <tr>
              {columns.map((_, i) => (
                <th key={i} className={headerPadding}>
                  <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t border-gray-100 dark:border-gray-700">
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className={cellPadding}>
                    <div className="h-4 w-full animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const pageNumbers = generatePageNumbers(page, totalPages);
  const allTableColumns = table.getAllColumns().filter((c) => c.getCanHide());

  return (
    <div className="overflow-hidden rounded-xl border border-theme bg-surface shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* ─── Toolbar ─── */}
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-theme bg-table-header px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800/60">
          {/* Global search */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Selection info */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5">
              <span className="text-xs font-medium text-primary-700">
                {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setRowSelection({})}
                className="rounded p-0.5 text-primary-500 hover:text-primary-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex-1" />

          {/* Extra toolbar content */}
          {toolbarExtra}

          {/* Column visibility */}
          {columnToggle && (
            <Dropdown
              trigger={
                <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                  <Columns3 className="h-3.5 w-3.5" />
                  Columnas
                </button>
              }
            >
              <div className="px-3 py-2">
                <p className="mb-2 text-xs font-semibold text-gray-500">Mostrar columnas</p>
                {allTableColumns.map((column) => (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        column.getIsVisible()
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}
                      onClick={() => column.toggleVisibility(!column.getIsVisible())}
                    >
                      {column.getIsVisible() && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span onClick={() => column.toggleVisibility(!column.getIsVisible())}>
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </span>
                  </label>
                ))}
              </div>
            </Dropdown>
          )}

          {/* Export */}
          {exportable && (
            <button
              onClick={() => exportToCsv(data, columns, exportFilename)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          )}
        </div>
      )}

      {/* ─── Mobile Card View ─── */}
      {cardRenderer && (
        <div className="md:hidden">
          {table.getRowModel().rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Inbox className="mx-auto h-11 w-11 text-gray-200 dark:text-gray-600" />
              <p className="mt-3 text-sm font-medium text-gray-400 dark:text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {cardRenderer(row.original)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Desktop Table ─── */}
      <div className={`overflow-x-auto ${stickyHeader ? 'max-h-[600px] overflow-y-auto' : ''} ${cardRenderer ? 'hidden md:block' : ''}`}>
        <table className="min-w-full">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-theme bg-table-header dark:border-gray-700 dark:bg-gray-800/70">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const isActions = header.id === 'actions' || header.id === 'acciones';
                  const isSelect = header.id === 'select';
                  return (
                    <th
                      key={header.id}
                      className={`${headerPadding} text-[11px] font-bold uppercase tracking-wider text-gray-400 ${isActions ? 'text-right' : 'text-left'} ${isSelect ? 'w-10' : ''} ${canSort ? 'cursor-pointer select-none transition-colors hover:text-gray-600' : ''}`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={header.column.getSize() !== 150 ? { width: header.column.getSize() } : undefined}
                    >
                      <div className={`flex items-center gap-1.5 ${isActions ? 'justify-end' : ''}`}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && !isSelect && (
                          <span className="text-gray-300">
                            {sorted === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-primary-500" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="h-3 w-3 text-primary-500" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                      {/* Per-column filter */}
                      {filterable && header.column.getCanFilter() && !isSelect && !isActions && (
                        <input
                          type="text"
                          value={(header.column.getFilterValue() as string) ?? ''}
                          onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Filtrar..."
                          className="mt-1.5 h-6 w-full rounded border border-gray-200 bg-white px-2 text-[10px] font-normal normal-case tracking-normal text-gray-600 placeholder-gray-300 focus:border-primary-400 focus:outline-none"
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={finalColumns.length} className="px-5 py-20 text-center">
                  <Inbox className="mx-auto h-11 w-11 text-gray-200 dark:text-gray-600" />
                  <p className="mt-3 text-sm font-medium text-gray-400 dark:text-gray-500">{emptyMessage}</p>
                  <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">Intenta con otros filtros de busqueda</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => {
                const isSelected = row.getIsSelected();
                return (
                  <tr
                    key={row.id}
                    className={[
                      'group transition-colors',
                      isSelected && 'bg-primary-50/60',
                      !isSelected && striped && idx % 2 === 1 && 'bg-table-stripe dark:bg-gray-750/30',
                      onRowClick
                        ? 'cursor-pointer border-l-2 border-l-transparent hover:border-l-primary-500 hover:bg-table-hover dark:hover:bg-primary-950/20'
                        : 'hover:bg-table-hover dark:hover:bg-gray-700/40',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActions = cell.column.id === 'actions' || cell.column.id === 'acciones';
                      const isSelect = cell.column.id === 'select';
                      return (
                        <td
                          key={cell.id}
                          className={`whitespace-nowrap ${cellPadding} text-sm text-gray-600 dark:text-gray-300 ${isActions ? 'text-right' : ''} ${isSelect ? 'w-10' : ''}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Footer / Pagination ─── */}
      {(onPageChange && totalPages > 0) && (
        <div className="flex items-center justify-between border-t border-theme bg-table-header px-5 py-3 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="text-xs text-gray-400">
            {total !== undefined && (
              <span>
                <span className="font-semibold text-gray-600">{total.toLocaleString()}</span> registros
                {totalPages > 1 && (
                  <>
                    {' '}&middot; Pag. <span className="font-semibold text-gray-600">{page}</span> de {totalPages}
                  </>
                )}
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30"
                title="Primera pagina"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30"
                title="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`e${i}`} className="px-1 text-xs text-gray-300">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      p === page
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30"
                title="Siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30"
                title="Ultima pagina"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
