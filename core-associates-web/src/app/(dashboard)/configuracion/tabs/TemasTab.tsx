'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/lib/theme-provider';
import {
  Check,
  Moon,
  Sun,
  Save,
  RotateCcw,
  Palette,
  LayoutDashboard,
  Users,
  BarChart3,
  Bell,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';

// ─── Theme Model ─────────────────────────────────────────────────────────────

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

const DEFAULT_THEME: ThemeConfig = {
  preset: 'core-associates',
  isDark: false,
  primary: '#2563eb',
  secondary: '#7c3aed',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  bgSurface: '#ffffff',
  bgPage: '#f9fafb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  borderColor: '#e5e7eb',
};

const DARK_OVERRIDES: Partial<ThemeConfig> = {
  bgSurface: '#1f2937',
  bgPage: '#111827',
  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  borderColor: '#374151',
};

const LIGHT_OVERRIDES: Partial<ThemeConfig> = {
  bgSurface: '#ffffff',
  bgPage: '#f9fafb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  borderColor: '#e5e7eb',
};

// ─── Presets ─────────────────────────────────────────────────────────────────

interface PresetDef {
  code: string;
  name: string;
  section: string;
  colors: [string, string, string];
  theme: Omit<ThemeConfig, 'isDark'>;
}

const PRESETS: PresetDef[] = [
  {
    code: 'core-associates', name: 'Core Associates', section: 'CORPORATIVO',
    colors: ['#2563eb', '#7c3aed', '#f59e0b'],
    theme: { preset: 'core-associates', primary: '#2563eb', secondary: '#7c3aed', accent: '#f59e0b', success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6', bgSurface: '#ffffff', bgPage: '#f9fafb', textPrimary: '#111827', textSecondary: '#6b7280', borderColor: '#e5e7eb' },
  },
  {
    code: 'indriver', name: 'InDriver', section: 'CORPORATIVO',
    colors: ['#22c55e', '#15803d', '#fbbf24'],
    theme: { preset: 'indriver', primary: '#22c55e', secondary: '#15803d', accent: '#fbbf24', success: '#22c55e', warning: '#fbbf24', error: '#dc2626', info: '#0ea5e9', bgSurface: '#ffffff', bgPage: '#f0fdf4', textPrimary: '#14532d', textSecondary: '#4b5563', borderColor: '#d1fae5' },
  },
  {
    code: 'enterprise', name: 'Enterprise', section: 'CORPORATIVO',
    colors: ['#0d1b2a', '#1b4965', '#caa42c'],
    theme: { preset: 'enterprise', primary: '#0d1b2a', secondary: '#1b4965', accent: '#caa42c', success: '#059669', warning: '#d97706', error: '#b91c1c', info: '#1b4965', bgSurface: '#ffffff', bgPage: '#f8fafc', textPrimary: '#0f172a', textSecondary: '#64748b', borderColor: '#e2e8f0' },
  },
  {
    code: 'ocean', name: 'Ocean', section: 'ESTILOS',
    colors: ['#0ea5e9', '#0284c7', '#06b6d4'],
    theme: { preset: 'ocean', primary: '#0ea5e9', secondary: '#0284c7', accent: '#06b6d4', success: '#14b8a6', warning: '#f59e0b', error: '#f43f5e', info: '#0ea5e9', bgSurface: '#ffffff', bgPage: '#f0f9ff', textPrimary: '#0c4a6e', textSecondary: '#64748b', borderColor: '#bae6fd' },
  },
  {
    code: 'forest', name: 'Forest', section: 'ESTILOS',
    colors: ['#16a34a', '#15803d', '#84cc16'],
    theme: { preset: 'forest', primary: '#16a34a', secondary: '#15803d', accent: '#84cc16', success: '#22c55e', warning: '#eab308', error: '#dc2626', info: '#0d9488', bgSurface: '#ffffff', bgPage: '#f0fdf4', textPrimary: '#14532d', textSecondary: '#4b5563', borderColor: '#bbf7d0' },
  },
  {
    code: 'sunset', name: 'Sunset', section: 'ESTILOS',
    colors: ['#ea580c', '#dc2626', '#f59e0b'],
    theme: { preset: 'sunset', primary: '#ea580c', secondary: '#dc2626', accent: '#f59e0b', success: '#16a34a', warning: '#f59e0b', error: '#dc2626', info: '#6366f1', bgSurface: '#ffffff', bgPage: '#fff7ed', textPrimary: '#7c2d12', textSecondary: '#78716c', borderColor: '#fed7aa' },
  },
  {
    code: 'royal', name: 'Royal', section: 'ESTILOS',
    colors: ['#7c3aed', '#6d28d9', '#ec4899'],
    theme: { preset: 'royal', primary: '#7c3aed', secondary: '#6d28d9', accent: '#ec4899', success: '#10b981', warning: '#f59e0b', error: '#e11d48', info: '#8b5cf6', bgSurface: '#ffffff', bgPage: '#faf5ff', textPrimary: '#3b0764', textSecondary: '#6b7280', borderColor: '#e9d5ff' },
  },
  {
    code: 'minimal', name: 'Minimal', section: 'ESTILOS',
    colors: ['#374151', '#1f2937', '#6b7280'],
    theme: { preset: 'minimal', primary: '#374151', secondary: '#1f2937', accent: '#6b7280', success: '#059669', warning: '#d97706', error: '#dc2626', info: '#6b7280', bgSurface: '#ffffff', bgPage: '#f9fafb', textPrimary: '#111827', textSecondary: '#9ca3af', borderColor: '#e5e7eb' },
  },
];

// ─── Color Helpers ───────────────────────────────────────────────────────────

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
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  h /= 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function deriveSidebarBg(primary: string): string {
  const [h, s] = hexToHsl(primary);
  return hslToHex(h, Math.min(s, 0.7), 0.12);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TemasTab() {
  const { applyTheme } = useTheme();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [savedTheme, setSavedTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('themeConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ThemeConfig;
        setTheme(parsed);
        setSavedTheme(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  // Apply theme to DOM in real-time as user edits (live preview on actual UI)
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setTheme((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const applyPreset = (preset: PresetDef) => {
    setTheme((prev) => ({
      ...prev,
      ...preset.theme,
      isDark: prev.isDark,
      ...(prev.isDark ? DARK_OVERRIDES : {}),
    }));
    setHasChanges(true);
  };

  const toggleDarkMode = () => {
    const next = !theme.isDark;
    updateTheme({ isDark: next, ...(next ? DARK_OVERRIDES : LIGHT_OVERRIDES) });
  };

  const handleSave = () => {
    localStorage.setItem('themeConfig', JSON.stringify(theme));
    setSavedTheme(theme);
    setHasChanges(false);
  };

  const handleReset = () => {
    setTheme(savedTheme);
    setHasChanges(false);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestion de Temas</h3>
          <p className="mt-0.5 text-sm text-gray-500">Personaliza colores, modo oscuro y apariencia del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Cambios sin guardar
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Revertir
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Guardar tema
          </button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="mt-5 flex gap-4" style={{ minHeight: 560 }}>
        <PresetPanel
          presets={PRESETS}
          activePreset={theme.preset}
          isDark={theme.isDark}
          onSelectPreset={applyPreset}
          onToggleDark={toggleDarkMode}
        />
        <ThemePreviewPanel theme={theme} />
        <ColorEditorPanel theme={theme} onUpdate={updateTheme} />
      </div>
    </div>
  );
}

// ─── Preset Panel (Left Column - 260px) ──────────────────────────────────────

function PresetPanel({ presets, activePreset, isDark, onSelectPreset, onToggleDark }: {
  presets: PresetDef[];
  activePreset: string;
  isDark: boolean;
  onSelectPreset: (p: PresetDef) => void;
  onToggleDark: () => void;
}) {
  const sections = [...new Set(presets.map((p) => p.section))];

  return (
    <div className="flex w-[260px] shrink-0 flex-col overflow-y-auto rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-pink-500" />
          <span className="text-sm font-semibold text-gray-700">Temas Predefinidos</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {sections.map((section) => (
          <div key={section}>
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{section}</p>
            <div className="space-y-1.5">
              {presets.filter((p) => p.section === section).map((preset) => (
                <button
                  key={preset.code}
                  onClick={() => onSelectPreset(preset)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                    activePreset === preset.code
                      ? 'bg-blue-50 ring-2 ring-blue-400'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex -space-x-1.5">
                    {preset.colors.map((c, i) => (
                      <div
                        key={i}
                        className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: c, zIndex: 3 - i }}
                      />
                    ))}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{preset.name}</span>
                  {activePreset === preset.code && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Dark mode toggle */}
        <div className="border-t pt-4">
          <button
            onClick={onToggleDark}
            className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 transition-colors hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
              <span className="text-sm font-medium text-gray-700">Modo Oscuro</span>
            </div>
            <div className={`relative h-5 w-9 rounded-full transition-colors ${isDark ? 'bg-indigo-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Theme Preview Panel (Center Column - flex) ──────────────────────────────

function ThemePreviewPanel({ theme }: { theme: ThemeConfig }) {
  const sidebarBg = deriveSidebarBg(theme.primary);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <span className="text-sm font-semibold text-gray-700">Vista previa</span>
        <span className="ml-2 text-xs text-gray-400">Asi se vera tu sistema</span>
      </div>

      <div className="flex-1 p-4">
        {/* Miniature dashboard */}
        <div className="flex overflow-hidden rounded-lg border shadow-sm" style={{ backgroundColor: theme.bgPage, height: 400 }}>
          {/* Mini sidebar */}
          <div className="flex w-[170px] shrink-0 flex-col" style={{ backgroundColor: sidebarBg }}>
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
              <div className="h-6 w-6 rounded-lg" style={{ backgroundColor: theme.primary }} />
              <span className="text-[10px] font-bold text-white">Core Associates</span>
            </div>
            <div className="flex-1 space-y-0.5 px-2 py-3">
              {[
                { icon: LayoutDashboard, label: 'Dashboard', active: true },
                { icon: Users, label: 'Asociados', active: false },
                { icon: BarChart3, label: 'Reportes', active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
                  style={{
                    backgroundColor: item.active ? theme.primary + '30' : 'transparent',
                    color: item.active ? '#ffffff' : '#d1d5db',
                  }}
                >
                  <item.icon className="h-3 w-3" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full" style={{ backgroundColor: theme.secondary }} />
                <p className="text-[9px] text-gray-300">Admin</p>
              </div>
            </div>
          </div>

          {/* Main area */}
          <div className="flex-1 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b px-3 py-2" style={{ backgroundColor: theme.bgSurface, borderColor: theme.borderColor }}>
              <span className="text-xs font-semibold" style={{ color: theme.textPrimary }}>Dashboard</span>
              <div className="flex items-center gap-2">
                <div className="flex h-6 items-center rounded border px-1.5" style={{ borderColor: theme.borderColor }}>
                  <Search className="h-2.5 w-2.5" style={{ color: theme.textSecondary }} />
                </div>
                <Bell className="h-3 w-3" style={{ color: theme.textSecondary }} />
                <span className="rounded px-2 py-0.5 text-[9px] font-medium text-white" style={{ backgroundColor: theme.primary }}>+ Nuevo</span>
              </div>
            </div>

            <div className="p-3">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Asociados', val: '1,234', color: theme.primary },
                  { label: 'Activos', val: '987', color: theme.success },
                  { label: 'Alertas', val: '12', color: theme.error },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border p-2" style={{ backgroundColor: theme.bgSurface, borderColor: theme.borderColor }}>
                    <p className="text-[9px]" style={{ color: theme.textSecondary }}>{s.label}</p>
                    <p className="text-base font-bold" style={{ color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Chart bars */}
              <div className="mt-2 rounded-md border p-2.5" style={{ backgroundColor: theme.bgSurface, borderColor: theme.borderColor }}>
                <p className="mb-1.5 text-[9px] font-medium" style={{ color: theme.textPrimary }}>Actividad reciente</p>
                <div className="flex items-end gap-1" style={{ height: 50 }}>
                  {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: i === 6 ? theme.primary : theme.primary + '40' }} />
                  ))}
                </div>
              </div>

              {/* Toast previews */}
              <div className="mt-2 space-y-1">
                {[
                  { icon: CheckCircle2, label: 'Operacion exitosa', color: theme.success },
                  { icon: AlertTriangle, label: 'Atencion requerida', color: theme.warning },
                  { icon: XCircle, label: 'Error en el proceso', color: theme.error },
                  { icon: Info, label: 'Informacion del sistema', color: theme.info },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-1.5 rounded border px-2 py-1" style={{ borderColor: t.color + '40', backgroundColor: t.color + '10' }}>
                    <t.icon className="h-2.5 w-2.5" style={{ color: t.color }} />
                    <span className="text-[9px] font-medium" style={{ color: t.color }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Color palette summary */}
        <div className="mt-3 flex items-center justify-center gap-6">
          {[
            { label: 'Primario', color: theme.primary },
            { label: 'Secundario', color: theme.secondary },
            { label: 'Acento', color: theme.accent },
            { label: 'Sidebar', color: sidebarBg },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c.color }} />
              <div>
                <p className="text-[10px] font-medium text-gray-600">{c.label}</p>
                <p className="font-mono text-[9px] text-gray-400">{c.color}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Color Editor Panel (Right Column - 300px) ──────────────────────────────

function ColorEditorPanel({ theme, onUpdate }: {
  theme: ThemeConfig;
  onUpdate: (updates: Partial<ThemeConfig>) => void;
}) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col overflow-y-auto rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <span className="text-sm font-semibold text-gray-700">Editor de Colores</span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <ColorSection title="Colores Principales">
          <ColorRow label="Primario" value={theme.primary} onChange={(v) => onUpdate({ primary: v })} />
          <ColorRow label="Secundario" value={theme.secondary} onChange={(v) => onUpdate({ secondary: v })} />
          <ColorRow label="Acento" value={theme.accent} onChange={(v) => onUpdate({ accent: v })} />
        </ColorSection>

        <ColorSection title="Colores Semanticos">
          <ColorRow label="Exito" value={theme.success} onChange={(v) => onUpdate({ success: v })} />
          <ColorRow label="Alerta" value={theme.warning} onChange={(v) => onUpdate({ warning: v })} />
          <ColorRow label="Error" value={theme.error} onChange={(v) => onUpdate({ error: v })} />
          <ColorRow label="Informacion" value={theme.info} onChange={(v) => onUpdate({ info: v })} />
        </ColorSection>

        <ColorSection title="Superficie y Fondo">
          <ColorRow label="Superficie" value={theme.bgSurface} onChange={(v) => onUpdate({ bgSurface: v })} />
          <ColorRow label="Fondo pagina" value={theme.bgPage} onChange={(v) => onUpdate({ bgPage: v })} />
          <ColorRow label="Bordes" value={theme.borderColor} onChange={(v) => onUpdate({ borderColor: v })} />
        </ColorSection>

        <ColorSection title="Colores de Texto">
          <ColorRow label="Texto principal" value={theme.textPrimary} onChange={(v) => onUpdate({ textPrimary: v })} />
          <ColorRow label="Texto secundario" value={theme.textSecondary} onChange={(v) => onUpdate({ textSecondary: v })} />
        </ColorSection>
      </div>
    </div>
  );
}

// ─── Shared Sub-Components ───────────────────────────────────────────────────

function ColorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50">
      <label className="relative cursor-pointer">
        <div className="h-7 w-7 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-700">{label}</p>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
        }}
        className="w-[78px] rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-600 focus:border-blue-400 focus:outline-none"
      />
    </div>
  );
}
