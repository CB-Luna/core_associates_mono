'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  documentType: string;
}

export function RejectDocumentDialog({ open, onClose, onConfirm, documentType }: RejectDocumentDialogProps) {
  const [motivo, setMotivo] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    onConfirm(motivo.trim());
    setMotivo('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Rechazar documento</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Estás por rechazar el documento <strong>{documentType.replace(/_/g, ' ')}</strong>.
          Indica el motivo para que el asociado pueda corregirlo.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: La imagen está borrosa, no se leen los datos..."
            required
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!motivo.trim()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Rechazar documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
