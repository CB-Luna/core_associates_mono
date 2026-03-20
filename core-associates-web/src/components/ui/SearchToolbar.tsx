'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchToolbarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  filterOptions?: { label: string; value: string }[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

export function SearchToolbar({
  placeholder = 'Buscar...',
  onSearch,
  filterOptions,
  filterValue,
  onFilterChange,
  actionLabel,
  actionIcon,
  onAction,
}: SearchToolbarProps) {
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-3">
        <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value === '') onSearch('');
            }}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </form>

        {filterOptions && onFilterChange && (
          <select
            value={filterValue || ''}
            onChange={(e) => onFilterChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Todos</option>
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {actionIcon}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
