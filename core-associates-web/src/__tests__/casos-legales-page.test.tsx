import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CasosLegalesPage from '@/app/(dashboard)/casos-legales/page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn(),
  apiImageUrl: vi.fn(),
}));

// Mock export-utils
vi.mock('@/lib/export-utils', () => ({
  exportToCSV: vi.fn(),
  exportToPrintPDF: vi.fn(),
}));

const mockCasos = {
  data: [
    {
      id: 'caso-1',
      codigo: 'CL-001',
      tipoPercance: 'accidente',
      descripcion: 'Choque menor',
      estado: 'abierto',
      prioridad: 'alta',
      fechaApertura: '2025-06-01T10:00:00Z',
      asociado: { nombre: 'Carlos', apellidoPat: 'Ruiz', idUnico: 'A001' },
      abogado: null,
    },
    {
      id: 'caso-2',
      codigo: 'CL-002',
      tipoPercance: 'infraccion',
      descripcion: 'Multa de tránsito',
      estado: 'resuelto',
      prioridad: 'baja',
      fechaApertura: '2025-05-20T08:00:00Z',
      asociado: { nombre: 'Ana', apellidoPat: 'López', idUnico: 'A002' },
      abogado: { razonSocial: 'Bufete Legal' },
    },
  ],
  meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
};

describe('CasosLegalesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and subtitle', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockCasos);

    render(<CasosLegalesPage />);

    expect(screen.getByText('Casos Legales')).toBeInTheDocument();
    expect(screen.getByText('Gestión de percances y asistencia legal')).toBeInTheDocument();
  });

  it('should render stats cards', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockCasos);

    render(<CasosLegalesPage />);

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Abiertos')).toBeInTheDocument();
      expect(screen.getByText('En Proceso')).toBeInTheDocument();
      expect(screen.getByText('Resueltos')).toBeInTheDocument();
    });
  });

  it('should render data table with cases', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockCasos);

    render(<CasosLegalesPage />);

    await waitFor(() => {
      expect(screen.getByText('CL-001')).toBeInTheDocument();
      expect(screen.getByText('CL-002')).toBeInTheDocument();
    });
  });

  it('should show asociado names in table', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockCasos);

    render(<CasosLegalesPage />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
      expect(screen.getByText('Ana López')).toBeInTheDocument();
    });
  });

  it('should render CSV and PDF export buttons', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockCasos);

    render(<CasosLegalesPage />);

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('should render filter dropdowns', async () => {
    const { apiClient } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockResolvedValue(mockCasos);

    render(<CasosLegalesPage />);

    await waitFor(() => {
      expect(screen.getByText('Todas las prioridades')).toBeInTheDocument();
    });
  });
});
