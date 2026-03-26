'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot,
  Save,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Upload,
  Send,
  ImageIcon,
  Clock,
  Shield,
  Cpu,
  Settings2,
  FlaskConical,
  Loader2,
} from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import type { ConfiguracionIA } from '@/lib/api-types';

const AI_PROVIDERS = [
  { key: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'] },
  { key: 'google', label: 'Google Gemini', models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'] },
];

// Module definitions — fixed, not user-creatable
const MODULE_DEFS: Record<string, { label: string; desc: string; icon: typeof FileText; color: string }> = {
  document_analyzer: {
    label: 'Validacion documental',
    desc: 'Analisis automatico de INE, selfie y tarjeta de circulacion',
    icon: FileText,
    color: 'blue',
  },
  chatbot_assistant: {
    label: 'Asistente del CRM',
    desc: 'Chatbot para operadores y administradores del panel',
    icon: MessageSquare,
    color: 'violet',
  },
};

function SectionToggle({ title, icon: Icon, open, onToggle, children }: {
  title: string; icon: typeof Settings2; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <button onClick={onToggle} className="flex w-full items-center justify-between p-5 text-left">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="border-t px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
    </label>
  );
}

export function ConfAITab() {
  const [configs, setConfigs] = useState<ConfiguracionIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string>('document_analyzer');
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Section toggles
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    motor: true, reglas: true, avanzado: false, prueba: false,
  });
  const toggleSection = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  // Test state
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [chatTestInput, setChatTestInput] = useState('');
  const [chatTestMessages, setChatTestMessages] = useState<{ role: string; content: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombre: '',
    provider: 'google',
    modelo: 'gemini-2.5-flash',
    apiKey: '',
    promptSistema: '',
    temperatura: 0.3,
    maxTokens: 4096,
    activo: true,
    umbralAutoAprobacion: 0.90,
    umbralAutoRechazo: 0.40,
    maxRechazosPreval: 5,
    horasBloqueoPreval: 24,
    chatbotActivo: true,
    modoAvanzadoDisponible: true,
    maxPreguntasPorHora: 20,
  });

  const selected = configs.find((c) => c.clave === selectedKey) || null;

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
      chatbotActivo: config.chatbotActivo ?? true,
      modoAvanzadoDisponible: config.modoAvanzadoDisponible ?? true,
      maxPreguntasPorHora: config.maxPreguntasPorHora ?? 20,
    });
  }, []);

  const fetchConfigs = useCallback(async (selectClave?: string) => {
    setLoading(true);
    try {
      const data = await apiClient<ConfiguracionIA[]>('/ai/config');
      setConfigs(data);
      const key = selectClave || selectedKey;
      const found = data.find((c) => c.clave === key);
      if (found) {
        setSelectedKey(found.clave);
        populateForm(found);
      } else if (data.length > 0) {
        setSelectedKey(data[0].clave);
        populateForm(data[0]);
      }
    } catch { /* API may not be ready */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [populateForm]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelect = (clave: string) => {
    setSelectedKey(clave);
    const config = configs.find((c) => c.clave === clave);
    if (config) { populateForm(config); setShowApiKey(false); }
    // Reset test state
    setTestFile(null); setTestResult(null); setChatTestMessages([]);
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
      };
      if (form.apiKey) body.apiKey = form.apiKey;
      if (form.promptSistema !== undefined) body.promptSistema = form.promptSistema;

      if (selected.clave === 'document_analyzer') {
        body.umbralAutoAprobacion = form.umbralAutoAprobacion;
        body.umbralAutoRechazo = form.umbralAutoRechazo;
        body.maxRechazosPreval = form.maxRechazosPreval;
        body.horasBloqueoPreval = form.horasBloqueoPreval;
      }
      if (selected.clave === 'chatbot_assistant') {
        body.chatbotActivo = form.chatbotActivo;
        body.modoAvanzadoDisponible = form.modoAvanzadoDisponible;
        body.maxPreguntasPorHora = form.maxPreguntasPorHora;
      }

      await apiClient(`/ai/config/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      showToast('success', 'Configuracion guardada correctamente');
      fetchConfigs(selected.clave);
    } catch (err: any) {
      showToast('error', err.message || 'Error al guardar');
    } finally {
      setSaving(false);
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
      fetchConfigs(selected.clave);
      showToast('success', form.activo ? 'Modulo desactivado' : 'Modulo activado');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Document test handler
  const handleDocTest = async () => {
    if (!testFile) return;
    setTesting(true); setTestResult(null);
    try {
      const fd = new FormData();
      fd.append('file', testFile);
      fd.append('tipo', 'ine_frontal');
      const result = await apiClient<any>('/documentos/pre-validar', { method: 'POST', body: fd });
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ error: true, message: err.message || 'Error en la prueba' });
    } finally { setTesting(false); }
  };

  // Chat test handler
  const handleChatTest = async () => {
    if (!chatTestInput.trim()) return;
    const userMsg = chatTestInput.trim();
    setChatTestInput('');
    setChatTestMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setTesting(true);
    try {
      const res = await apiClient<{ respuesta: string; fuente?: string }>('/asistente/preguntar', {
        method: 'POST', body: JSON.stringify({ pregunta: userMsg }),
      });
      setChatTestMessages((m) => [...m, { role: 'assistant', content: res.respuesta }]);
    } catch (err: any) {
      setChatTestMessages((m) => [...m, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally { setTesting(false); }
  };

  const selectedProvider = AI_PROVIDERS.find((p) => p.key === form.provider) || AI_PROVIDERS[0];
  const isDocModule = selectedKey === 'document_analyzer';
  const isChatModule = selectedKey === 'chatbot_assistant';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">IA del sistema</h3>
          <p className="mt-1 text-sm text-gray-500">
            Administra los modelos usados por la validacion documental y el asistente del CRM
          </p>
        </div>
        <button onClick={handleSave} disabled={saving || !selected}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
          toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left panel: Fixed module cards ── */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
            ))
          ) : (
            Object.entries(MODULE_DEFS).map(([clave, def]) => {
              const cfg = configs.find((c) => c.clave === clave);
              const isSelected = selectedKey === clave;
              const Icon = def.icon;
              const colorMap: Record<string, { ring: string; bg: string; icon: string; dot: string }> = {
                blue: { ring: 'ring-blue-500 border-blue-500', bg: 'bg-blue-50', icon: 'text-blue-600', dot: 'bg-blue-500' },
                violet: { ring: 'ring-violet-500 border-violet-500', bg: 'bg-violet-50', icon: 'text-violet-600', dot: 'bg-violet-500' },
              };
              const c = colorMap[def.color] || colorMap.blue;

              return (
                <button
                  key={clave}
                  onClick={() => handleSelect(clave)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected ? `${c.ring} ${c.bg} ring-1` : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-lg p-2 ${isSelected ? c.bg : 'bg-gray-100'}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? c.icon : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">{def.label}</span>
                        <span className={`h-2.5 w-2.5 rounded-full ${cfg?.activo ? 'bg-green-500' : 'bg-gray-300'}`} title={cfg?.activo ? 'Activo' : 'Inactivo'} />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{def.desc}</p>
                      {cfg ? (
                        <p className="mt-1.5 text-xs text-gray-400">
                          {cfg.provider} / {cfg.modelo} · {cfg.activo ? 'Activo' : 'Inactivo'}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs italic text-amber-500">Sin configurar</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Right panel: Section-based editor ── */}
        {selected ? (
          <div className="space-y-4 lg:col-span-2">

            {/* ─── Resumen ─── */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => { const d = MODULE_DEFS[selected.clave]; const I = d?.icon || Bot; return <I className="h-5 w-5 text-gray-600" />; })()}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">
                      {MODULE_DEFS[selected.clave]?.label || selected.nombre}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {MODULE_DEFS[selected.clave]?.desc || selected.clave}
                    </p>
                  </div>
                </div>
                <button onClick={handleToggleActive}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.activo
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {form.activo ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                  {form.activo ? 'Activo' : 'Desactivado'}
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">Proveedor</p>
                  <p className="text-sm font-medium text-gray-800">{selected.provider}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">Modelo</p>
                  <p className="truncate text-sm font-medium text-gray-800">{selected.modelo}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">Clave API</p>
                  <p className="text-sm font-medium text-gray-800">{selected.apiKey ? 'Registrada' : 'Sin registrar'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">Ultima actualizacion</p>
                  <p className="text-sm font-medium text-gray-800">{new Date(selected.updatedAt).toLocaleDateString('es-MX')}</p>
                </div>
              </div>
            </div>

            {/* ─── Motor IA ─── */}
            <SectionToggle title="Motor IA" icon={Cpu} open={openSections.motor} onToggle={() => toggleSection('motor')}>
              {/* Provider selector */}
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Proveedor</label>
                <div className="grid grid-cols-2 gap-3">
                  {AI_PROVIDERS.map((p) => (
                    <button key={p.key}
                      onClick={() => setForm((f) => ({ ...f, provider: p.key, modelo: p.models[0] }))}
                      className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-left transition-all ${
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
              {/* Model + Name + API Key */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del modulo</label>
                  <input value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Modelo</label>
                  <select value={form.modelo}
                    onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {selectedProvider.models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Clave API</label>
                  <div className="relative mt-1">
                    <input type={showApiKey ? 'text' : 'password'}
                      value={form.apiKey}
                      onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                      placeholder={selected.apiKey ? 'Dejar vacio para mantener la actual' : 'sk-...'}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {selected.apiKey && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                      <Shield className="h-3 w-3" /> Clave registrada ({selected.apiKey})
                    </p>
                  )}
                </div>
              </div>
            </SectionToggle>

            {/* ─── Reglas del modulo ─── */}
            <SectionToggle title="Reglas del modulo" icon={Shield} open={openSections.reglas} onToggle={() => toggleSection('reglas')}>
              {isDocModule && (
                <>
                  <p className="mb-4 text-xs text-gray-500">Umbrales de confianza para auto-aprobacion/rechazo y limites anti-abuso</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Auto-aprobar si confianza ≥ <span className="font-mono text-green-600">{(form.umbralAutoAprobacion * 100).toFixed(0)}%</span>
                      </label>
                      <input type="range" min="0.5" max="1" step="0.05" value={form.umbralAutoAprobacion}
                        onChange={(e) => setForm((f) => ({ ...f, umbralAutoAprobacion: parseFloat(e.target.value) }))}
                        className="mt-2 w-full accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400"><span>50%</span><span>100%</span></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Auto-rechazar si confianza &lt; <span className="font-mono text-red-600">{(form.umbralAutoRechazo * 100).toFixed(0)}%</span>
                      </label>
                      <input type="range" min="0" max="0.8" step="0.05" value={form.umbralAutoRechazo}
                        onChange={(e) => setForm((f) => ({ ...f, umbralAutoRechazo: parseFloat(e.target.value) }))}
                        className="mt-2 w-full accent-red-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400"><span>0%</span><span>80%</span></div>
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
                  {/* Prompt for documental */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Prompt del sistema</label>
                    <textarea value={form.promptSistema} rows={3}
                      onChange={(e) => setForm((f) => ({ ...f, promptSistema: e.target.value }))}
                      placeholder="Ej: Analizar imagenes, las imagenes subidas deben de corresponder a un ID INE, frontal, Reverso. Asi tambien como de Selfie..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {isChatModule && (
                <>
                  <p className="mb-4 text-xs text-gray-500">Controla la disponibilidad global del asistente IA en el CRM</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3">
                      <ToggleSwitch checked={form.chatbotActivo} onChange={(v) => setForm((f) => ({ ...f, chatbotActivo: v }))} />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Chatbot activo</p>
                        <p className="text-xs text-gray-400">Mostrar asistente a usuarios</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ToggleSwitch checked={form.modoAvanzadoDisponible} onChange={(v) => setForm((f) => ({ ...f, modoAvanzadoDisponible: v }))} />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Modo avanzado</p>
                        <p className="text-xs text-gray-400">Permitir consultas IA por API</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Limite de preguntas/hora</label>
                      <input type="number" min="1" max="200" value={form.maxPreguntasPorHora}
                        onChange={(e) => setForm((f) => ({ ...f, maxPreguntasPorHora: parseInt(e.target.value) || 20 }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <p className="mt-1 text-xs text-gray-400">Rate limiting por usuario</p>
                    </div>
                  </div>
                  {/* Prompt for chatbot */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Prompt del sistema</label>
                    <textarea value={form.promptSistema} rows={3}
                      onChange={(e) => setForm((f) => ({ ...f, promptSistema: e.target.value }))}
                      placeholder="Instrucciones adicionales para el asistente del CRM..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </SectionToggle>

            {/* ─── Avanzado ─── */}
            <SectionToggle title="Avanzado" icon={Settings2} open={openSections.avanzado} onToggle={() => toggleSection('avanzado')}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Temperatura: <span className="font-mono text-indigo-600">{form.temperatura.toFixed(1)}</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.1" value={form.temperatura}
                    onChange={(e) => setForm((f) => ({ ...f, temperatura: parseFloat(e.target.value) }))}
                    className="mt-2 w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400"><span>Preciso (0)</span><span>Creativo (1)</span></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Limite de respuesta (tokens)</label>
                  <input type="number" min="100" max="16384" value={form.maxTokens}
                    onChange={(e) => setForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) || 4096 }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Maximo de tokens en la respuesta del modelo</p>
                </div>
              </div>
            </SectionToggle>

            {/* ─── Prueba ─── */}
            <SectionToggle title="Prueba" icon={FlaskConical} open={openSections.prueba} onToggle={() => toggleSection('prueba')}>
              {isDocModule && (
                <div>
                  <p className="mb-3 text-xs text-gray-500">Sube una imagen de prueba para verificar que la IA responde correctamente</p>
                  <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { setTestFile(e.target.files?.[0] || null); setTestResult(null); }} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {testFile ? testFile.name : 'Seleccionar imagen'}
                    </button>
                    <button onClick={handleDocTest} disabled={!testFile || testing}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Probar validacion
                    </button>
                  </div>
                  {testResult && (
                    <div className={`mt-4 rounded-lg border p-4 text-sm ${
                      testResult.error ? 'border-red-200 bg-red-50' :
                      testResult.valida ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
                    }`}>
                      {testResult.error ? (
                        <p className="text-red-700">{testResult.message}</p>
                      ) : (
                        <>
                          <div className="mb-2 flex items-center gap-2">
                            {testResult.valida
                              ? <><CheckCircle className="h-4 w-4 text-green-600" /><span className="font-medium text-green-700">Imagen valida</span></>
                              : <><AlertTriangle className="h-4 w-4 text-amber-600" /><span className="font-medium text-amber-700">Imagen no valida</span></>
                            }
                          </div>
                          {testResult.motivo && <p className="text-gray-700">{testResult.motivo}</p>}
                          {testResult.advertencia && <p className="mt-1 text-amber-600">{testResult.advertencia}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isChatModule && (
                <div>
                  <p className="mb-3 text-xs text-gray-500">Envia un mensaje de prueba al asistente para verificar su funcionamiento</p>
                  <div className="rounded-lg border border-gray-200 bg-gray-50">
                    {/* Messages */}
                    <div className="max-h-48 space-y-2 overflow-y-auto p-3">
                      {chatTestMessages.length === 0 && (
                        <p className="py-4 text-center text-xs text-gray-400">Escribe un mensaje para probar el asistente</p>
                      )}
                      {chatTestMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 shadow-sm'
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {testing && (
                        <div className="flex justify-start">
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Input */}
                    <div className="flex items-center gap-2 border-t border-gray-200 p-2">
                      <input value={chatTestInput}
                        onChange={(e) => setChatTestInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatTest()}
                        placeholder="Ej: cuantos asociados hay?"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button onClick={handleChatTest} disabled={!chatTestInput.trim() || testing}
                        className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </SectionToggle>

            {/* ─── Bottom actions ─── */}
            <div className="flex items-center justify-between border-t pt-4">
              <button onClick={handleToggleActive}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  form.activo
                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {form.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                {form.activo ? 'Desactivar modulo' : 'Activar modulo'}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar cambios
              </button>
            </div>
          </div>
        ) : !loading ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 lg:col-span-2">
            <div className="py-20 text-center">
              <Bot className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">Selecciona un modulo para configurarlo</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
