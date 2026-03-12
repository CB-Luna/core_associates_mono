'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ─── Color math ──────────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a full 11-shade palette from a single base hex color.
 * Maps: 50, 100, 200, 300, 400, 500, 600(base), 700, 800, 900, 950
 */
function generatePalette(baseHex: string): Record<string, string> {
  const [h, s] = hexToHsl(baseHex);

  // Lightness values for each shade (Tailwind-like distribution)
  const shades: [string, number][] = [
    ['50', 0.96],
    ['100', 0.91],
    ['200', 0.83],
    ['300', 0.72],
    ['400', 0.58],
    ['500', 0.48],
    ['600', 0.40],
    ['700', 0.33],
    ['800', 0.27],
    ['900', 0.22],
    ['950', 0.14],
  ];

  // Adjust saturation slightly for lighter/darker ends
  const result: Record<string, string> = {};
  for (const [shade, l] of shades) {
    const satAdj = l > 0.7 ? s * 0.8 : l < 0.25 ? s * 0.9 : s;
    result[shade] = hslToHex(h, Math.min(satAdj, 1), l);
  }

  return result;
}

function deriveSidebarBg(primaryHex: string): string {
  const [h, s] = hexToHsl(primaryHex);
  return hslToHex(h, Math.min(s, 0.7), 0.12);
}

// ─── Theme Config Type (matches TemasTab) ────────────────────────────────────

interface ThemeConfig {
  preset: string;
  isDark: boolean;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  bgSurface: string;
  bgPage: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: ThemeConfig | null;
  applyTheme: (config: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  applyTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Apply CSS variables to document ─────────────────────────────────────────

function applyThemeToDOM(config: ThemeConfig) {
  const root = document.documentElement;

  // Generate primary palette from base color
  const palette = generatePalette(config.primary);
  for (const [shade, hex] of Object.entries(palette)) {
    root.style.setProperty(`--primary-${shade}`, hex);
  }

  // Semantic colors
  root.style.setProperty('--color-success', config.success);
  root.style.setProperty('--color-warning', config.warning);
  root.style.setProperty('--color-error', config.error);
  root.style.setProperty('--color-info', config.info);

  // Sidebar
  const sidebarBg = deriveSidebarBg(config.primary);
  root.style.setProperty('--sidebar-bg', sidebarBg);
  root.style.setProperty('--sidebar-text', '#d1d5db');
  root.style.setProperty('--sidebar-active-text', '#ffffff');
}

// ─── Provider Component ──────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('themeConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved) as ThemeConfig;
        setTheme(config);
        applyThemeToDOM(config);
      } catch { /* use CSS defaults */ }
    }

    // Listen for changes from other tabs or from TemasTab saving
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'themeConfig' && e.newValue) {
        try {
          const config = JSON.parse(e.newValue) as ThemeConfig;
          setTheme(config);
          applyThemeToDOM(config);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const applyTheme = useCallback((config: ThemeConfig) => {
    setTheme(config);
    applyThemeToDOM(config);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
