'use client';

import { TabLayout, type TabItem } from '@/components/ui/TabLayout';
import { Users, ShieldCheck, Lock, LayoutList, Palette, Server, Bot } from 'lucide-react';
import { UsuariosTab } from './tabs/UsuariosTab';
import { AuditoriaTab } from './tabs/AuditoriaTab';
import { RolesTab } from './tabs/RolesTab';
import { PermisosTab } from './tabs/PermisosTab';
import { MenuDinamicoTab } from './tabs/MenuDinamicoTab';
import { TemasTab } from './tabs/TemasTab';
import { SistemaInfoTab } from './tabs/SistemaInfoTab';
import { ConfAITab } from './tabs/ConfAITab';

const tabs: TabItem[] = [
  { key: 'usuarios', label: 'Usuarios', icon: Users, color: 'blue', component: <UsuariosTab /> },
  { key: 'roles', label: 'Roles', icon: ShieldCheck, color: 'purple', component: <RolesTab /> },
  { key: 'permisos', label: 'Permisos', icon: Lock, color: 'amber', component: <PermisosTab /> },
  { key: 'menu', label: 'Menu Dinamico', icon: LayoutList, color: 'teal', component: <MenuDinamicoTab /> },
  { key: 'temas', label: 'Temas', icon: Palette, color: 'pink', component: <TemasTab /> },
  { key: 'sistema', label: 'Info del Sistema', icon: Server, color: 'gray', component: <SistemaInfoTab /> },
  { key: 'auditoria', label: 'Auditoria', icon: ShieldCheck, color: 'purple', component: <AuditoriaTab /> },
  { key: 'ai', label: 'Conf AI', icon: Bot, color: 'indigo', component: <ConfAITab /> },
];

export default function ConfiguracionPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
      <p className="mt-1 text-sm text-gray-600">Gestion de usuarios, roles, permisos y sistema</p>

      <div className="mt-6">
        <TabLayout tabs={tabs} defaultTab="usuarios" />
      </div>
    </div>
  );
}
