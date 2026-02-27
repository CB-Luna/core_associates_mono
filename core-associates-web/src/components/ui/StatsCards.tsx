'use client';

import { cn } from '@/lib/utils';

interface StatCard {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  subtitle?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
};

interface StatsCardsProps {
  cards: StatCard[];
  className?: string;
}

export function StatsCards({ cards, className }: StatsCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {cards.map((card) => (
        <div
          key={card.title}
          className={cn('rounded-xl border p-5', colorClasses[card.color])}
        >
          <p className="text-sm font-medium opacity-80">{card.title}</p>
          <p className="mt-1 text-3xl font-bold">{card.value}</p>
          {card.subtitle && (
            <p className="mt-1 text-xs opacity-60">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
