'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  component: React.ReactNode;
}

interface TabLayoutProps {
  tabs: TabItem[];
  defaultTab?: string;
  onTabChange?: (key: string) => void;
}

const colorMap: Record<string, { bg: string; text: string; activeBg: string; border: string }> = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-600',   activeBg: 'bg-blue-50',   border: 'border-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', activeBg: 'bg-purple-50', border: 'border-purple-600' },
  amber:  { bg: 'bg-amber-100',  text: 'text-amber-600',  activeBg: 'bg-amber-50',  border: 'border-amber-600' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-600',   activeBg: 'bg-teal-50',   border: 'border-teal-600' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-600',   activeBg: 'bg-pink-50',   border: 'border-pink-600' },
  gray:   { bg: 'bg-gray-200',   text: 'text-gray-600',   activeBg: 'bg-gray-50',   border: 'border-gray-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', activeBg: 'bg-indigo-50', border: 'border-indigo-600' },
};

export function TabLayout({ tabs, defaultTab, onTabChange }: TabLayoutProps) {
  const [activeKey, setActiveKey] = useState(defaultTab || tabs[0]?.key || '');

  const handleTabClick = (key: string) => {
    setActiveKey(key);
    onTabChange?.(key);
  };

  const activeTab = tabs.find((t) => t.key === activeKey);
  const activeColors = activeTab ? (colorMap[activeTab.color] || colorMap.blue) : colorMap.blue;

  return (
    <div>
      {/* Mobile: dropdown selector */}
      <div className="md:hidden">
        <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <select
            value={activeKey}
            onChange={(e) => handleTabClick(e.target.value)}
            className="w-full appearance-none rounded-xl bg-transparent py-3 pl-12 pr-10 text-sm font-medium text-gray-700 focus:outline-none dark:text-gray-200"
          >
            {tabs.map((tab) => (
              <option key={tab.key} value={tab.key}>{tab.label}</option>
            ))}
          </select>
          {/* Active tab icon */}
          {activeTab && (() => {
            const Icon = activeTab.icon;
            return (
              <span className={`pointer-events-none absolute left-3 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-lg ${activeColors.bg} ${activeColors.text}`}>
                <Icon className="h-4 w-4" />
              </span>
            );
          })()}
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Desktop: horizontal tab bar */}
      <div className="hidden md:block">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex gap-1 overflow-x-auto p-1.5 [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const isActive = tab.key === activeKey;
              const colors = colorMap[tab.color] || colorMap.blue;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? `${colors.activeBg} border-b-[3px] ${colors.border} ${colors.text} dark:bg-gray-700`
                      : 'border-b-[3px] border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <span
                    className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg ${
                      isActive ? `${colors.bg} ${colors.text}` : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab?.component}
      </div>
    </div>
  );
}
