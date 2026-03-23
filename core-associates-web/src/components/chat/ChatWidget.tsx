'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { usePermisos } from '@/lib/permisos';
import { apiClient } from '@/lib/api-client';
import type { ChatbotStatus } from '@/lib/api-types';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

const DEFAULT_W = 380;
const DEFAULT_H = 480;

export function ChatWidget() {
  const { isOpen, isMinimized, isLoading, addMessage, setLoading, restore, mode } = useChatStore();
  const { puede } = usePermisos();

  // ── Global chatbot status (from admin config) ──
  const [chatbotStatus, setChatbotStatus] = useState<ChatbotStatus | null>(null);

  useEffect(() => {
    if (!puede('asistente:ver')) return;
    apiClient<ChatbotStatus>('/ai/config/chatbot-status')
      .then(setChatbotStatus)
      .catch(() => setChatbotStatus({ chatbotActivo: true, modoAvanzadoDisponible: true, maxPreguntasPorHora: 20 }));
  }, [puede]);

  // ── Dragging logic ──
  const widgetRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -1, y: -1 }); // -1 = not initialised
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Init position bottom-right
  useEffect(() => {
    if (pos.x === -1 && typeof window !== 'undefined') {
      setPos({
        x: window.innerWidth - DEFAULT_W - 24,
        y: window.innerHeight - DEFAULT_H - 24,
      });
    }
  }, [pos.x]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only drag from header area (first child)
      if (!(e.target as HTMLElement).closest('[data-drag-handle]')) return;
      dragging.current = true;
      offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const nx = Math.max(0, Math.min(e.clientX - offset.current.x, window.innerWidth - DEFAULT_W));
    const ny = Math.max(0, Math.min(e.clientY - offset.current.y, window.innerHeight - 48));
    setPos({ x: nx, y: ny });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // ── Send message handler (now uses backend) ──
  const handleSend = useCallback(
    async (text: string) => {
      addMessage({ role: 'user', content: text });
      setLoading(true);

      try {
        const result = await apiClient<{
          respuesta: string;
          fuente: 'clasico' | 'ia';
          intent?: string;
        }>('/asistente/preguntar', {
          method: 'POST',
          body: JSON.stringify({
            pregunta: text,
            modoAvanzado: mode === 'avanzado',
          }),
        });

        addMessage({
          role: 'assistant',
          content: result.respuesta,
          source: result.fuente,
          intent: result.intent,
        });
      } catch {
        addMessage({
          role: 'assistant',
          content: 'Ocurrió un error al consultar los datos. Inténtalo de nuevo.',
          source: 'clasico',
        });
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, mode],
  );

  // ── Sin permiso o chatbot desactivado globalmente → no renderizar ──
  if (!puede('asistente:ver')) return null;
  if (chatbotStatus && !chatbotStatus.chatbotActivo) return null;

  // ── Minimised FAB ──
  if (isMinimized) {
    return (
      <button
        onClick={restore}
        className="fixed bottom-6 right-6 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-110"
        title="Abrir asistente"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      ref={widgetRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed z-[90] flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-600 dark:bg-gray-800"
      style={{
        width: DEFAULT_W,
        height: DEFAULT_H,
        left: pos.x,
        top: pos.y,
        /* prevent text selection while dragging */
        userSelect: dragging.current ? 'none' : 'auto',
      }}
    >
      {/* Drag handle wraps header */}
      <div data-drag-handle className="cursor-move">
        <ChatHeader modoAvanzadoGlobal={chatbotStatus?.modoAvanzadoDisponible ?? true} />
      </div>

      {/* Messages area */}
      <ChatMessages onSuggestion={handleSend} />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
