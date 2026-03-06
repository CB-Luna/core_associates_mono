'use client';

import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  desde: string;
  hasta: string;
  onDesdeChange: (value: string) => void;
  onHastaChange: (value: string) => void;
  className?: string;
}

export default function DateRangePicker({
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={desde}
          onChange={(e) => onDesdeChange(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
        />
        <span className="text-sm text-gray-500">—</span>
        <input
          type="date"
          value={hasta}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => onHastaChange(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
        />
      </div>
    </div>
  );
}
