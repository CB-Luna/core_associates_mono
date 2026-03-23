'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Escribe tu pregunta…"
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="rounded-lg p-1.5 text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-30 dark:text-primary-400 dark:hover:bg-primary-950/30"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
