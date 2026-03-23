'use client';

import { Minus, X, Trash2 } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { usePermisos } from '@/lib/permisos';

export function ChatHeader({ modoAvanzadoGlobal = true }: { modoAvanzadoGlobal?: boolean }) {
  const mode = useChatStore((s) => s.mode);
  const setMode = useChatStore((s) => s.setMode);
  const minimize = useChatStore((s) => s.minimize);
  const close = useChatStore((s) => s.close);
  const clearHistory = useChatStore((s) => s.clearHistory);
  const msgCount = useChatStore((s) => s.messages.length);
  const { puede } = usePermisos();
  const puedeAvanzado = puede('asistente:modo-avanzado') && modoAvanzadoGlobal;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-2 text-white dark:border-gray-600">
      {/* Left: title + mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Asistente</span>

        {/* Mode toggle pill — avanzado solo si tiene permiso */}
        <div className="flex rounded-full bg-white/20 p-0.5 text-[10px]">
          <button
            onClick={() => setMode('clasico')}
            className={`rounded-full px-2 py-0.5 transition-colors ${
              mode === 'clasico' ? 'bg-white text-primary-700 font-medium' : 'text-white/80 hover:text-white'
            }`}
          >
            Clásico
          </button>
          {puedeAvanzado && (
            <button
              onClick={() => setMode('avanzado')}
              className={`rounded-full px-2 py-0.5 transition-colors ${
                mode === 'avanzado' ? 'bg-white text-primary-700 font-medium' : 'text-white/80 hover:text-white'
              }`}
            >
              Avanzado
            </button>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-0.5">
        {msgCount > 0 && (
          <button
            onClick={clearHistory}
            className="rounded p-1 transition-colors hover:bg-white/20"
            title="Limpiar historial"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={minimize}
          className="rounded p-1 transition-colors hover:bg-white/20"
          title="Minimizar"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={close}
          className="rounded p-1 transition-colors hover:bg-white/20"
          title="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
