'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Plus,
  Save,
  Trash2,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { ConfiguracionIA } from '@/lib/api-types';

const AI_PROVIDERS = [
  { key: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'] },
];

export function ConfAITab() {
  const [configs, setConfigs] = useState<ConfiguracionIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ConfiguracionIA | null>(null);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    provider: 'anthropic',
    modelo: 'claude-sonnet-4-5-20250929',
    apiKey: '',
    promptSistema: '',
    temperatura: 0.3,
    maxTokens: 4096,
    activo: true,
    umbralAutoAprobacion: 0.90,
    umbralAutoRechazo: 0.40,
    maxRechazosPreval: 5,
    horasBloqueoPreval: 24,
  });

  const populateForm = useCallback((config: ConfiguracionIA) => {
    setForm({
      nombre: config.nombre,
      provider: config.provider,
      modelo: config.modelo,
      apiKey: '',
      promptSistema: config.promptSistema || '',
      temperatura: config.temperatura,
      maxTokens: config.maxTokens,
      activo: config.activo,
      umbralAutoAprobacion: config.umbralAutoAprobacion ?? 0.90,
      umbralAutoRechazo: config.umbralAutoRechazo ?? 0.40,
      maxRechazosPreval: config.maxRechazosPreval ?? 5,
      horasBloqueoPreval: config.horasBloqueoPreval ?? 24,
    });
  }, []);

  const fetchConfigs = useCallback(async (selectId?: string) => {
    setLoading(true);
    try {
      const data = await apiClient<ConfiguracionIA[]>('/ai/config');
      setConfigs(data);
      if (selectId) {
        const found = data.find((c) => c.id === selectId);
        if (found) { setSelected(found); populateForm(found); }
      } else if (data.length > 0 && !selected) {
        setSelected(data[0]);
        populateForm(data[0]);
      }
    } catch { /* API may not be ready */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [populateForm]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelect = (config: ConfiguracionIA) => {
    setSelected(config);
    populateForm(config);
    setShowApiKey(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, any> = {
        nombre: form.nombre,
        provider: form.provider,
        modelo: form.modelo,
        temperatura: form.temperatura,
        maxTokens: form.maxTokens,
        activo: form.activo,
        umbralAutoAprobacion: form.umbralAutoAprobacion,
        umbralAutoRechazo: form.umbralAutoRechazo,
        maxRechazosPreval: form.maxRechazosPreval,
        horasBloqueoPreval: form.horasBloqueoPreval,
      };
      if (form.apiKey) body.apiKey = form.apiKey;
      if (form.promptSistema) body.promptSistema = form.promptSistema;

      await apiClient(`/ai/config/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      showToast('success', 'Configuracion guardada');
      fetchConfigs(selected.id);
    } catch (err: any) {
      showToast('error', err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const clave = `config_${Date.now()}`;
    try {
      const created = await apiClient<ConfiguracionIA>('/ai/config', {
        method: 'POST',
        body: JSON.stringify({
          clave,
          nombre: 'Nueva Configuracion',
          provider: 'anthropic',
          modelo: 'claude-sonnet-4-5-20250929',
          temperatura: 0.2,
          maxTokens: 4096,
        }),
      });
      fetchConfigs(created.id);
      showToast('success', 'Configuracion creada');
    } catch (err: any) {
      showToast('error', err.message || 'Error al crear');
    }
  };

  const handleDelete = async () => {
    if (!selected || !confirm('Eliminar esta configuracion?')) return;
    try {
      await apiClient(`/ai/config/${selected.id}`, { method: 'DELETE' });
      setSelected(null);
      fetchConfigs();
      showToast('success', 'Configuracion eliminada');
    } catch (err: any) {
      showToast('error', err.message || 'Error');
    }
  };

  const handleToggleActive = async () => {
    if (!selected) return;
    try {
      await apiClient(`/ai/config/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: !form.activo }),
      });
      setForm((f) => ({ ...f, activo: !f.activo }));
      fetchConfigs(selected.id);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const selectedProvider = AI_PROVIDERS.find((p) => p.key === form.provider) || AI_PROVIDERS[0];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configuracion de IA</h3>
          <p className="mt-1 text-sm text-gray-500">Gestionar proveedores, modelos y API keys para validacion documental</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Config
        </button>
      </div>

      {toast && (
        <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
          toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Config list */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))
          ) : configs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <Bot className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400">Sin configuraciones</p>
              <p className="text-xs text-gray-400">Crea una para empezar</p>
            </div>
          ) : (
            configs.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  selected?.id === c.id
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{c.nombre}</span>
                  <span className={`h-2 w-2 rounded-full ${c.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <p className="mt-1 text-xs text-gray-500">{c.provider} / {c.modelo}</p>
                <p className="text-xs text-gray-400">Clave: {c.clave}</p>
              </button>
            ))
          )}
        </div>

        {/* Editor */}
        {selected ? (
          <div className="space-y-5 lg:col-span-2">
            {/* Provider */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">Proveedor</h4>
              <div className="grid grid-cols-3 gap-3">
                {AI_PROVIDERS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setForm((f) => ({ ...f, provider: p.key, modelo: p.models[0] }))}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all ${
                      form.provider === p.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Bot className={`h-5 w-5 ${form.provider === p.key ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${form.provider === p.key ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model + API Key */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">Modelo y Credenciales</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Modelo</label>
                  <select
                    value={form.modelo}
                    onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {selectedProvider.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">API Key</label>
                  <div className="relative mt-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={form.apiKey}
                      onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                      placeholder={selected.apiKey || 'sk-ant-...'}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {selected.apiKey && <p className="mt-1 text-xs text-gray-400">Actual: {selected.apiKey}</p>}
                </div>
              </div>
            </div>

            {/* Params */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">Parametros</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Temperatura: <span className="font-mono text-indigo-600">{form.temperatura.toFixed(1)}</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.1" value={form.temperatura}
                    onChange={(e) => setForm((f) => ({ ...f, temperatura: parseFloat(e.target.value) }))}
                    className="mt-2 w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Preciso (0)</span><span>Creativo (1)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
                  <input type="number" min="100" max="16384" value={form.maxTokens}
                    onChange={(e) => setForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) || 4096 }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Validacion Documental IA */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h4 className="mb-1 text-sm font-semibold text-gray-700">Validacion Documental IA</h4>
              <p className="mb-4 text-xs text-gray-400">Umbrales de confianza para auto-aprobacion/rechazo y limites anti-abuso</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Auto-aprobar si confianza ≥ <span className="font-mono text-green-600">{(form.umbralAutoAprobacion * 100).toFixed(0)}%</span>
                  </label>
                  <input type="range" min="0.5" max="1" step="0.05" value={form.umbralAutoAprobacion}
                    onChange={(e) => setForm((f) => ({ ...f, umbralAutoAprobacion: parseFloat(e.target.value) }))}
                    className="mt-2 w-full accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>50%</span><span>100%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Auto-rechazar si confianza &lt; <span className="font-mono text-red-600">{(form.umbralAutoRechazo * 100).toFixed(0)}%</span>
                  </label>
                  <input type="range" min="0" max="0.8" step="0.05" value={form.umbralAutoRechazo}
                    onChange={(e) => setForm((f) => ({ ...f, umbralAutoRechazo: parseFloat(e.target.value) }))}
                    className="mt-2 w-full accent-red-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0%</span><span>80%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max rechazos pre-validacion</label>
                  <input type="number" min="1" max="50" value={form.maxRechazosPreval}
                    onChange={(e) => setForm((f) => ({ ...f, maxRechazosPreval: parseInt(e.target.value) || 5 }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Intentos fallidos permitidos por tipo antes de bloquear</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horas de bloqueo</label>
                  <input type="number" min="1" max="168" value={form.horasBloqueoPreval}
                    onChange={(e) => setForm((f) => ({ ...f, horasBloqueoPreval: parseInt(e.target.value) || 24 }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Duracion del bloqueo tras exceder rechazos</p>
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">Prompt del Sistema (opcional)</h4>
              <textarea value={form.promptSistema} rows={4}
                onChange={(e) => setForm((f) => ({ ...f, promptSistema: e.target.value }))}
                placeholder="Instrucciones adicionales para el modelo de IA..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={handleToggleActive}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    form.activo ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {form.activo ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  {form.activo ? 'Activo' : 'Inactivo'}
                </button>
                <button onClick={handleDelete}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </button>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 lg:col-span-2">
            <div className="py-20 text-center">
              <Bot className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">Selecciona o crea una configuracion</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
