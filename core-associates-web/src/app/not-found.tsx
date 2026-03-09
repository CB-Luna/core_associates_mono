'use client';

import { FileX, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <FileX className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          Página no encontrada
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          La página que buscas no existe o fue movida.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
