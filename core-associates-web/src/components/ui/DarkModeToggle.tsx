'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme, DARK_OVERRIDES, LIGHT_OVERRIDES } from '@/lib/theme-provider';

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  const { theme, applyTheme } = useTheme();

  useEffect(() => {
    // Sync with themeConfig isDark if available, else localStorage 'theme'
    const stored = localStorage.getItem('theme');
    const isDark = theme?.isDark
      ?? (stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme?.isDark]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');

    // Sync CSS variables via ThemeProvider so all components update
    if (theme) {
      const overrides = next ? DARK_OVERRIDES : LIGHT_OVERRIDES;
      const updated = { ...theme, isDark: next, ...overrides };
      applyTheme(updated);
      localStorage.setItem('themeConfig', JSON.stringify(updated));
    }
  };

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
