'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Brain,
  ChevronLeft,
  ChevronRight,
  User,
  Zap,
} from 'lucide-react';
import { formatFechaConHora } from '@/lib/utils';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import type { DocumentoConAnalisis } from '@/lib/api-types';
import type { PaginatedResponse } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { DocumentViewer } from '@/components/documentos/DocumentViewer';
import { RejectDocumentDialog } from '@/components/documentos/RejectDocumentDialog';
import { AIAnalysisPanel } from '@/components/documentos/AIAnalysisPanel';

const tipoLabel: Record<string, string> = {
  ine_frente: 'INE Frente',
  ine_reverso: 'INE Reverso',
  selfie: 'Selfie',
  tarjeta_circulacion: 'Tarjeta Circulacion',
  otro: 'Otro',
};

export default function DocumentosReviewPage() {
  const [docs, setDocs] = useState<DocumentoConAnalisis[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [docUpdating, setDocUpdating] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; doc: DocumentoConAnalisis | null }>({ open: false, doc: null });

  const fetchDocs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiClient<PaginatedResponse<DocumentoConAnalisis>>(`/documentos/pendientes?page=${page}&limit=10`);
      setDocs(res.data);
      setMeta(res.meta);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleView = async (doc: DocumentoConAnalisis) => {
    try {
      const url = await apiImageUrl(`/documentos/${doc.id}/url`);
      setViewerUrl(url);
      setViewerTitle(tipoLabel[doc.tipo] || doc.tipo);
      setViewerOpen(true);
    } catch { /* ignore */ }
  };

  const handleApprove = async (doc: DocumentoConAnalisis) => {
    setDocUpdating(doc.id);
    try {
      await apiClient(`/documentos/${doc.id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'aprobado' }),
      });
      fetchDocs(meta.page);
    } catch { /* ignore */ }
    finally { setDocUpdating(null); }
  };

  const handleReject = async (motivo: string) => {
    if (!rejectDialog.doc) return;
    const docId = rejectDialog.doc.id;
    setRejectDialog({ open: false, doc: null });
    setDocUpdating(docId);
    try {
      await apiClient(`/documentos/${docId}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'rechazado', motivoRechazo: motivo }),
      });
      fetchDocs(meta.page);
    } catch { /* ignore */ }
    finally { setDocUpdating(null); }
  };

  const handleAnalyzeAll = async () => {
    for (const doc of docs) {
      if (!doc.analisis) {
        apiClient(`/ai/analysis/document/${doc.id}`, { method: 'POST' }).catch(() => {});
      }
    }
    // Refresh after a delay
    setTimeout(() => fetchDocs(meta.page), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revision de Documentos</h1>
          <p className="mt-1 text-sm text-gray-500">{meta.total} documento(s) pendiente(s) de revision</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAnalyzeAll}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <Brain className="h-4 w-4" />
            Analizar Todos con IA
          </button>
          <button
            onClick={() => fetchDocs(meta.page)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="mt-16 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-300" />
          <p className="mt-3 text-lg font-medium text-gray-600">Sin documentos pendientes</p>
          <p className="text-sm text-gray-400">Todos los documentos han sido revisados</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {docs.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Document type icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {tipoLabel[doc.tipo] || doc.tipo}
                      </h3>
                      <Badge variant="warning">Pendiente</Badge>
                      {doc.analisis?.estado === 'completado' && doc.analisis.confianza != null && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          doc.analisis.confianza >= 0.85
                            ? 'bg-green-100 text-green-700'
                            : doc.analisis.confianza >= 0.6
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          <Brain className="h-3 w-3" />
                          IA: {Math.round(doc.analisis.confianza * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Asociado info */}
                    {doc.asociado && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-3.5 w-3.5" />
                        {doc.asociado.nombre} {doc.asociado.apellidoPat}
                        <span className="text-gray-300">|</span>
                        {doc.asociado.idUnico}
                        <span className="text-gray-300">|</span>
                        {doc.asociado.telefono}
                      </div>
                    )}

                    <p className="mt-1 text-xs text-gray-400">
                      Subido: {formatFechaConHora(doc.createdAt)}
                      {' · '}
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(doc)}
                    className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleApprove(doc)}
                    disabled={docUpdating === doc.id}
                    className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => setRejectDialog({ open: true, doc })}
                    disabled={docUpdating === doc.id}
                    className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Rechazar
                  </button>
                </div>
              </div>

              {/* AI Analysis Panel */}
              <AIAnalysisPanel
                analisis={doc.analisis}
                documentoId={doc.id}
                documentoTipo={doc.tipo}
                onAnalysisUpdated={() => fetchDocs(meta.page)}
              />
            </div>
          ))}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                Pagina {meta.page} de {meta.totalPages} ({meta.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDocs(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => fetchDocs(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <DocumentViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageUrl={viewerUrl}
        title={viewerTitle}
      />

      <RejectDocumentDialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, doc: null })}
        onConfirm={handleReject}
        documentType={rejectDialog.doc?.tipo || ''}
      />
    </div>
  );
}
