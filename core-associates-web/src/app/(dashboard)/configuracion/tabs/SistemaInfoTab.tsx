'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Server, Database, HardDrive, Cpu } from 'lucide-react';

interface SystemInfo {
  apiVersion: string;
  nodeEnv: string;
  uptime: number;
}

export function SistemaInfoTab() {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<SystemInfo>('/reportes/system-info')
      .then(setSysInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Informacion del sistema</h3>
      <p className="mt-1 text-sm text-gray-500">Estado actual de los servicios</p>

      {/* API Info */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={Server}
          color="text-blue-600"
          bg="bg-blue-50"
          label="API Version"
          value={sysInfo?.apiVersion || 'v1.0.0'}
        />
        <InfoCard
          icon={Cpu}
          color="text-green-600"
          bg="bg-green-50"
          label="Entorno"
          value={sysInfo?.nodeEnv || 'development'}
        />
        <InfoCard
          icon={Server}
          color="text-purple-600"
          bg="bg-purple-50"
          label="Uptime"
          value={sysInfo?.uptime ? formatUptime(sysInfo.uptime) : '—'}
        />
      </div>

      {/* Infrastructure */}
      <h4 className="mt-8 text-sm font-semibold uppercase tracking-wider text-gray-500">Infraestructura</h4>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceCard
          icon={Database}
          label="PostgreSQL 16"
          status="Conectada"
          detail="Puerto 5432 (Docker)"
          color="text-blue-600"
        />
        <ServiceCard
          icon={HardDrive}
          label="Redis 7"
          status="Conectado"
          detail="Puerto 6379 (Docker)"
          color="text-red-500"
        />
        <ServiceCard
          icon={HardDrive}
          label="MinIO S3"
          status="Activo"
          detail="API 9002 / Console 9003"
          color="text-amber-600"
        />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, color, bg, label, value }: {
  icon: any;
  color: string;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ icon: Icon, label, status, detail, color }: {
  icon: any;
  label: string;
  status: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm font-medium text-green-600">{status}</span>
      </div>
      <p className="mt-1 text-xs text-gray-400">{detail}</p>
    </div>
  );
}
