'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from 'lucide-react';

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
}

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
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr>
              {columns.map((_, i) => (
                <th key={i} className="px-5 py-4">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t border-gray-100">
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="px-5 py-4">
                    <div className="h-4 w-full animate-pulse rounded-full bg-gray-100" />
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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50/70">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const isActions = header.id === 'actions' || header.id === 'acciones';
                  return (
                    <th
                      key={header.id}
                      className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 ${isActions ? 'text-right' : 'text-left'} ${canSort ? 'cursor-pointer select-none transition-colors hover:text-gray-600' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={`flex items-center gap-1.5 ${isActions ? 'justify-end' : ''}`}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
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
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-20 text-center">
                  <Inbox className="mx-auto h-11 w-11 text-gray-200" />
                  <p className="mt-3 text-sm font-medium text-gray-400">{emptyMessage}</p>
                  <p className="mt-1 text-xs text-gray-300">Intenta con otros filtros de búsqueda</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`group transition-colors ${onRowClick ? 'cursor-pointer border-l-2 border-l-transparent hover:border-l-primary-500 hover:bg-primary-50/40' : 'hover:bg-gray-50/60'}`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isActions = cell.column.id === 'actions' || cell.column.id === 'acciones';
                    return (
                      <td key={cell.id} className={`whitespace-nowrap px-5 py-3.5 text-sm text-gray-600 ${isActions ? 'text-right' : ''}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/40 px-5 py-3">
          <div className="text-xs text-gray-400">
            {total !== undefined && (
              <span>
                <span className="font-semibold text-gray-600">{total.toLocaleString()}</span> registros
                {totalPages > 1 && <> &middot; Pág. <span className="font-semibold text-gray-600">{page}</span> de {totalPages}</>}
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30"
                title="Primera página"
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
                  <span key={`e${i}`} className="px-1 text-xs text-gray-300">…</span>
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
                title="Última página"
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
