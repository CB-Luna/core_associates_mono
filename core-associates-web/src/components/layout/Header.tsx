'use client';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-sm text-gray-500">Panel de Administración</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">Administrador</span>
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
