'use client';

import { cn } from '@/lib/utils';
import {
  Users, Building2, Ticket, Scale, FileText, TrendingUp,
  type LucideIcon,
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  subtitle?: string;
  icon?: LucideIcon;
}

const colorConfig: Record<string, { card: string; icon: string; iconBg: string }> = {
  blue:   { card: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
  green:  { card: 'border-green-200 bg-gradient-to-br from-green-50 to-white', icon: 'text-green-600', iconBg: 'bg-green-100' },
  purple: { card: 'border-purple-200 bg-gradient-to-br from-purple-50 to-white', icon: 'text-purple-600', iconBg: 'bg-purple-100' },
  orange: { card: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white', icon: 'text-orange-600', iconBg: 'bg-orange-100' },
  red:    { card: 'border-red-200 bg-gradient-to-br from-red-50 to-white', icon: 'text-red-600', iconBg: 'bg-red-100' },
  gray:   { card: 'border-gray-200 bg-gradient-to-br from-gray-50 to-white', icon: 'text-gray-600', iconBg: 'bg-gray-100' },
};

const defaultIcons: Record<string, LucideIcon> = {
  blue: Users,
  green: Building2,
  purple: Ticket,
  orange: Scale,
  red: FileText,
  gray: TrendingUp,
};

interface StatsCardsProps {
  cards: StatCard[];
  className?: string;
}

export function StatsCards({ cards, className }: StatsCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {cards.map((card) => {
        const colors = colorConfig[card.color];
        const Icon = card.icon || defaultIcons[card.color];
        return (
          <div
            key={card.title}
            className={cn('group relative overflow-hidden rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md', colors.card)}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.title}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                {card.subtitle && (
                  <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
                )}
              </div>
              {Icon && (
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colors.iconBg)}>
                  <Icon className={cn('h-5 w-5', colors.icon)} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
