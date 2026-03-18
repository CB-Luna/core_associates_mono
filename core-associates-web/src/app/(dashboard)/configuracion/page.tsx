'use client';

import { useMemo } from 'react';
import { TabLayout, type TabItem } from '@/components/ui/TabLayout';
import { Users, ShieldCheck, Palette, Server, Bot } from 'lucide-react';
import { UsuariosTab } from './tabs/UsuariosTab';
import { AuditoriaTab } from './tabs/AuditoriaTab';
import { RolesAdminTab } from './tabs/RolesAdminTab';
import { TemasTab } from './tabs/TemasTab';
import { SistemaInfoTab } from './tabs/SistemaInfoTab';
import { ConfAITab } from './tabs/ConfAITab';
import { useAuthStore } from '@/stores/auth-store';

type ConfigTab = TabItem & { permiso?: string };

const allTabs: ConfigTab[] = [
  { key: 'usuarios', label: 'Usuarios', icon: Users, color: 'blue', component: <UsuariosTab />, permiso: 'configuracion:usuarios' },
  { key: 'roles', label: 'Roles y Permisos', icon: ShieldCheck, color: 'purple', component: <RolesAdminTab />, permiso: 'configuracion:roles' },
  { key: 'temas', label: 'Temas', icon: Palette, color: 'pink', component: <TemasTab />, permiso: 'configuracion:temas' },
  { key: 'sistema', label: 'Info del Sistema', icon: Server, color: 'gray', component: <SistemaInfoTab />, permiso: 'configuracion:info' },
  { key: 'auditoria', label: 'Auditoria', icon: ShieldCheck, color: 'purple', component: <AuditoriaTab />, permiso: 'configuracion:auditoria' },
  { key: 'ai', label: 'Conf AI', icon: Bot, color: 'indigo', component: <ConfAITab />, permiso: 'configuracion:ai' },
];

export default function ConfiguracionPage() {
  const user = useAuthStore((s) => s.user);
  const permisos = user?.permisos ?? [];

  const tabs = useMemo(() => {
    // Si el usuario no tiene permisos granulares, mostrar todas (retrocompatibilidad)
    const hasGranular = permisos.some((p) => p.startsWith('configuracion:') && p !== 'configuracion:ver');
    if (!hasGranular) return allTabs as TabItem[];
    return allTabs.filter((t) => !t.permiso || permisos.includes(t.permiso)) as TabItem[];
  }, [permisos]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuracion</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Gestion de usuarios, roles, permisos y sistema</p>

      <div className="mt-6">
        {tabs.length > 0 ? (
          <TabLayout tabs={tabs} defaultTab={tabs[0].key} />
        ) : (
          <p className="text-sm text-gray-500">No tienes permisos para ver ninguna sección de configuración.</p>
        )}
      </div>
    </div>
  );
}
