import {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  Ticket,
  Scale,
  BarChart3,
  Settings,
  FileText,
  FileCheck,
  HelpCircle,
  MapPinned,
  type LucideIcon,
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  Ticket,
  Scale,
  BarChart3,
  Settings,
  FileText,
  FileCheck,
  HelpCircle,
  MapPinned,
};

export function getIcon(iconName: string | null): LucideIcon {
  if (!iconName) return HelpCircle;
  return iconMap[iconName] || HelpCircle;
}
