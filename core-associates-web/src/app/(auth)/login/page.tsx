'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    proveedorId?: string;
  };
}

const PRESET_USERS = [
  {
    id: 'admin',
    name: 'Administrador',
    role: 'Admin',
    email: 'admin@coreassociates.com',
    password: 'Admin2026!',
    initials: 'AD',
    color: 'bg-blue-500',
  },
  {
    id: 'operador',
    name: 'Operador',
    role: 'Operador',
    email: 'operador@coreassociates.com',
    password: 'Operador2026!',
    initials: 'OP',
    color: 'bg-emerald-500',
  },
  {
    id: 'proveedor',
    name: 'Proveedor',
    role: 'Proveedor',
    email: 'proveedor@elrapido.com',
    password: 'Proveedor2026!',
    initials: 'PR',
    color: 'bg-amber-500',
  },
] as const;

export default function LoginPage() {
  const [serverError, setServerError] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSelectUser = (user: (typeof PRESET_USERS)[number]) => {
    setSelectedUser(user.id);
    setValue('email', user.email);
    setValue('password', user.password);
    setServerError('');
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');

    try {
      const res = await apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        requireAuth: false,
      });

      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
        <p className="mt-1 text-sm text-gray-500">
          Selecciona un usuario o ingresa tus credenciales
        </p>
      </div>

      {/* User selector cards */}
      <div className="mb-6 space-y-3">
        {PRESET_USERS.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => handleSelectUser(user)}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
              selectedUser === user.id
                ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-500/20'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${user.color} text-sm font-bold text-white shadow-sm`}
            >
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                selectedUser === user.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {user.role}
            </span>
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-3 text-xs text-gray-400">
            o ingresa tus credenciales
          </span>
        </div>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            {...register('email', {
              onChange: () => setSelectedUser(null),
            })}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="tu@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            {...register('password', {
              onChange: () => setSelectedUser(null),
            })}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-gray-400">
        Core Associates &copy; {new Date().getFullYear()}
      </p>
    </>
  );
}
