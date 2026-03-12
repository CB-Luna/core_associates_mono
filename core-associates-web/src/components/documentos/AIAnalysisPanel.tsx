'use client';

import { useState } from 'react';
import {
  Brain,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { AnalisisDocumento } from '@/lib/api-types';

interface AIAnalysisPanelProps {
  analisis: AnalisisDocumento | null | undefined;
  documentoId: string;
  documentoTipo: string;
  onAnalysisUpdated?: () => void;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 85 ? 'bg-green-100 text-green-700 border-green-200' :
    pct >= 60 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
    'bg-red-100 text-red-700 border-red-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}>
      {pct}%
    </span>
  );
}

function ValidationIcon({ passed }: { passed: boolean }) {
  return passed ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
}

const validationLabels: Record<string, string> = {
  es_ine_valida: 'INE valida',
  es_ine_reverso: 'INE reverso detectado',
  imagen_legible: 'Imagen legible',
  vigencia_ok: 'Vigencia vigente',
  formato_curp_valido: 'Formato CURP valido',
  integridad_visual: 'Integridad visual',
  es_tarjeta_circulacion: 'Tarjeta circulacion valida',
  formato_placas_valido: 'Formato placas valido',
  formato_vin_valido: 'Formato VIN valido',
  es_selfie_valida: 'Selfie valida',
  calidad_aceptable: 'Calidad aceptable',
};

const fieldLabels: Record<string, string> = {
  nombre_completo: 'Nombre Completo',
  apellido_paterno: 'Apellido Paterno',
  apellido_materno: 'Apellido Materno',
  nombre: 'Nombre(s)',
  curp: 'CURP',
  clave_elector: 'Clave Elector',
  vigencia: 'Vigencia',
  fecha_nacimiento: 'Fecha Nacimiento',
  sexo: 'Sexo',
  domicilio: 'Domicilio',
  estado: 'Estado',
  municipio: 'Municipio',
  placas: 'Placas',
  numero_serie: 'Numero de Serie (VIN)',
  marca: 'Marca',
  modelo: 'Modelo',
  anio_modelo: 'Año Modelo',
  color: 'Color',
  nombre_propietario: 'Propietario',
  rostro_detectado: 'Rostro Detectado',
  solo_una_persona: 'Una Sola Persona',
  imagen_nitida: 'Imagen Nitida',
  aparenta_ser_foto_real: 'Foto Real',
  genero_aparente: 'Genero',
  rango_edad_aparente: 'Rango Edad',
};

export function AIAnalysisPanel({ analisis, documentoId, documentoTipo, onAnalysisUpdated }: AIAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  const handleAnalyze = async () => {
    setReanalyzing(true);
    try {
      const endpoint = analisis
        ? `/ai/analysis/document/${documentoId}/reanalyze`
        : `/ai/analysis/document/${documentoId}`;
      await apiClient(endpoint, { method: 'POST' });
      onAnalysisUpdated?.();
    } catch {
      // ignore
    } finally {
      setReanalyzing(false);
    }
  };

  // No analysis yet
  if (!analisis) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <Brain className="h-4 w-4" />
            <span>Sin analisis de IA</span>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={reanalyzing}
            className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {reanalyzing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            Analizar con IA
          </button>
        </div>
      </div>
    );
  }

  // Processing
  if (analisis.estado === 'procesando') {
    return (
      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Analizando documento con IA...</span>
        </div>
      </div>
    );
  }

  // Error
  if (analisis.estado === 'error') {
    return (
      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Error en analisis de IA</span>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={reanalyzing}
            className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {reanalyzing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Completed
  const campos = analisis.datosExtraidos || {};
  const validaciones = analisis.validaciones || {};
  const allValid = Object.values(validaciones).every(Boolean);

  return (
    <div className="mt-3 rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-sm font-medium text-indigo-700">
          <Brain className="h-4 w-4" />
          Analisis IA
          {analisis.confianza != null && <ConfidenceBadge value={analisis.confianza} />}
          {allValid ? (
            <Shield className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        <button
          onClick={handleAnalyze}
          disabled={reanalyzing}
          className="flex items-center gap-1 rounded-md border border-indigo-200 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
        >
          {reanalyzing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Re-analizar
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Validations */}
          {Object.keys(validaciones).length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-500">Validaciones</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(validaciones).map(([key, passed]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-gray-700">
                    <ValidationIcon passed={passed as boolean} />
                    {validationLabels[key] || key.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted data */}
          {Object.keys(campos).length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-500">Datos Extraidos</p>
              <div className="space-y-1">
                {Object.entries(campos).map(([key, field]: [string, any]) => {
                  const valor = typeof field === 'object' ? field.valor : field;
                  const conf = typeof field === 'object' ? field.confianza : null;
                  if (valor === undefined || valor === null) return null;
                  return (
                    <div key={key} className="flex items-center justify-between rounded bg-white/60 px-2 py-1 text-xs">
                      <span className="text-gray-500">{fieldLabels[key] || key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {typeof valor === 'boolean' ? (valor ? 'Si' : 'No') : String(valor)}
                        </span>
                        {conf != null && <ConfidenceBadge value={conf} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
