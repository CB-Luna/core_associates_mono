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
  delta?: string;
}

const colorConfig: Record<string, { card: string; cardDark: string; icon: string; iconBg: string; watermark: string }> = {
  blue:   { card: 'border-blue-200/60 bg-gradient-to-br from-blue-50 to-white', cardDark: 'dark:border-blue-800/40 dark:from-blue-950/40 dark:to-gray-800', icon: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/50', watermark: 'text-blue-100 dark:text-blue-900/30' },
  green:  { card: 'border-green-200/60 bg-gradient-to-br from-green-50 to-white', cardDark: 'dark:border-green-800/40 dark:from-green-950/40 dark:to-gray-800', icon: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/50', watermark: 'text-green-100 dark:text-green-900/30' },
  purple: { card: 'border-purple-200/60 bg-gradient-to-br from-purple-50 to-white', cardDark: 'dark:border-purple-800/40 dark:from-purple-950/40 dark:to-gray-800', icon: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/50', watermark: 'text-purple-100 dark:text-purple-900/30' },
  orange: { card: 'border-orange-200/60 bg-gradient-to-br from-orange-50 to-white', cardDark: 'dark:border-orange-800/40 dark:from-orange-950/40 dark:to-gray-800', icon: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/50', watermark: 'text-orange-100 dark:text-orange-900/30' },
  red:    { card: 'border-red-200/60 bg-gradient-to-br from-red-50 to-white', cardDark: 'dark:border-red-800/40 dark:from-red-950/40 dark:to-gray-800', icon: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/50', watermark: 'text-red-100 dark:text-red-900/30' },
  gray:   { card: 'border-gray-200/60 bg-gradient-to-br from-gray-50 to-white', cardDark: 'dark:border-gray-700/40 dark:from-gray-800/40 dark:to-gray-800', icon: 'text-gray-600 dark:text-gray-400', iconBg: 'bg-gray-100 dark:bg-gray-700/50', watermark: 'text-gray-100 dark:text-gray-800/30' },
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
      {cards.map((card, index) => {
        const colors = colorConfig[card.color];
        const Icon = card.icon || defaultIcons[card.color];
        return (
          <div
            key={card.title}
            className={cn(
              'group relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
              colors.card,
              colors.cardDark,
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Watermark icon */}
            {Icon && (
              <Icon className={cn('absolute -bottom-3 -right-3 h-20 w-20 rotate-12 opacity-40 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6', colors.watermark)} />
            )}
            <div className="relative flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                {card.subtitle && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>
                )}
                {card.delta && (
                  <p className={cn('mt-1 flex items-center gap-1 text-xs font-medium', card.delta.startsWith('+') ? 'text-green-600 dark:text-green-400' : card.delta.startsWith('-') ? 'text-red-600 dark:text-red-400' : 'text-gray-500')}>
                    <TrendingUp className="h-3 w-3" />
                    {card.delta}
                  </p>
                )}
              </div>
              {Icon && (
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110', colors.iconBg)}>
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
