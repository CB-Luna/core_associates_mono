import { Shield, Users, Car } from 'lucide-react';
import LoginIllustration from '@/components/auth/LoginIllustration';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[60%] flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-12 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top - Logo & tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Car className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Core Associates
              </h1>
              <p className="text-sm text-primary-200">Panel de Administración</p>
            </div>
          </div>
          <p className="mt-6 text-lg text-primary-100 max-w-md leading-relaxed">
            Plataforma digital para conductores asociados
          </p>
        </div>

        {/* Center - Illustration */}
        <div className="relative z-10 -my-4">
          <LoginIllustration />
        </div>

        {/* Bottom - Feature highlights */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          <div className="flex flex-col items-start gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-primary-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Seguro</p>
              <p className="text-xs text-primary-300">
                Protección de datos y acceso controlado
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <Users className="h-5 w-5 text-primary-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Colaborativo</p>
              <p className="text-xs text-primary-300">
                Gestión integral de asociados
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <Car className="h-5 w-5 text-primary-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Eficiente</p>
              <p className="text-xs text-primary-300">
                Operaciones simplificadas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex w-full lg:w-[40%] flex-col">
        {/* Mobile branding header */}
        <div className="flex items-center gap-3 p-6 lg:hidden bg-gradient-to-r from-primary-700 to-primary-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Core Associates</h1>
            <p className="text-xs text-primary-200">Plataforma para conductores asociados</p>
          </div>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12 bg-gray-50">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
