import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

// Mock usePermisos
vi.mock('@/lib/permisos', () => ({
  usePermisos: vi.fn(() => ({ esProveedor: false, puede: () => true })),
}));

// Mock Toast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn(),
  apiImageUrl: vi.fn(),
}));

const mockMetrics = {
  asociados: { total: 200, activos: 150, pendientes: 20, suspendidos: 5, bajas: 15, rechazados: 10 },
  proveedores: { total: 30, activos: 25 },
  cupones: { delMes: 85 },
  casosLegales: { abiertos: 3 },
  documentos: { pendientes: 12 },
  trend: [
    { mes: 'Ene', asociados: 10, cupones: 20 },
    { mes: 'Feb', asociados: 15, cupones: 30 },
  ],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard title and subtitle', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockMetrics);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Resumen general de la plataforma')).toBeInTheDocument();
    });
  });

  it('should show loading spinner initially', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockReturnValue(new Promise(() => {})); // never resolves

    const { container } = render(<DashboardPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display stat cards with correct values', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockMetrics);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Asociados Activos')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Proveedores Activos')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Cupones del Mes')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('Casos Abiertos')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('should render chart containers', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockMetrics);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Tendencia Mensual')).toBeInTheDocument();
      expect(screen.getByText('Asociados por Estado')).toBeInTheDocument();
    });
  });

  it('should show error message on API failure', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockRejectedValue(new Error('Network error'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Error cargando métricas')).toBeInTheDocument();
    });
  });

  it('should render docs pendientes and asociados pendientes cards', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockMetrics);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Docs Pendientes')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Asociados Pendientes')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });
});
