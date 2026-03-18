'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { type Rol, type Permiso } from '@/lib/api-types';
import { Loader2, Layers, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { PlantillasPanel } from './PlantillasPanel';
import { PermisosMenuPanel } from './PermisosMenuPanel';
import { AsignacionesPanel } from './AsignacionesPanel';

type SubTab = 'plantillas' | 'permisos-menu' | 'asignaciones';

const SUB_TABS: { key: SubTab; label: string; icon: typeof Layers }[] = [
  { key: 'plantillas',    label: 'Plantillas',      icon: Layers },
  { key: 'permisos-menu', label: 'Permisos y Menú', icon: ShieldCheck },
  { key: 'asignaciones',  label: 'Asignaciones',    icon: UsersIcon },
];

export function RolesAdminTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SubTab>('plantillas');
  const [roles, setRoles] = useState<Rol[]>([]);
  const [allPermisos, setAllPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRolId, setSelectedRolId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permisosRes] = await Promise.all([
        apiClient<Rol[]>('/roles'),
        apiClient<Permiso[]>('/roles/permisos'),
      ]);
      setRoles(rolesRes);
      setAllPermisos(permisosRes);

      // Auto-select first role if none selected
      if (!selectedRolId && rolesRes.length > 0) {
        setSelectedRolId(rolesRes[0].id);
      }
    } catch {
      toast('error', 'Error', 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  }, [selectedRolId]);

  useEffect(() => { fetchData(); }, []);

  const selectedRol = roles.find((r) => r.id === selectedRolId) || null;

  const handleSelectRol = (id: string) => {
    setSelectedRolId(id);
    // Auto-navigate to permisos tab when selecting a role
    if (activeTab === 'plantillas') {
      setActiveTab('permisos-menu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-sm text-gray-500">Cargando roles y permisos...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Roles y Permisos</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Administra plantillas de roles, permisos, items de menú y asignaciones de usuarios.
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'plantillas' && (
        <PlantillasPanel
          roles={roles}
          selectedRolId={selectedRolId}
          onSelectRol={handleSelectRol}
          onRefresh={fetchData}
        />
      )}
      {activeTab === 'permisos-menu' && (
        <PermisosMenuPanel
          rol={selectedRol}
          allPermisos={allPermisos}
          onRefresh={fetchData}
        />
      )}
      {activeTab === 'asignaciones' && (
        <AsignacionesPanel
          rol={selectedRol}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
