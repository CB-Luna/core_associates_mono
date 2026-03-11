import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AsociadoDetailPage from '@/app/(dashboard)/asociados/[id]/page';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-id-123' }),
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn(),
  apiImageUrl: vi.fn(),
}));

// Mock permisos
vi.mock('@/lib/permisos', () => ({
  usePermisos: () => ({ puede: () => true, esProveedor: false }),
}));

// Mock DocumentViewer y RejectDocumentDialog
vi.mock('@/components/documentos/DocumentViewer', () => ({
  DocumentViewer: () => null,
}));
vi.mock('@/components/documentos/RejectDocumentDialog', () => ({
  RejectDocumentDialog: () => null,
}));

const mockAsociado = {
  id: 'test-id-123',
  idUnico: 'A-001',
  nombre: 'Carlos',
  apellidoPat: 'García',
  apellidoMat: 'López',
  telefono: '+525510000001',
  email: 'carlos@test.com',
  fechaNacimiento: '1990-05-15',
  fotoUrl: null,
  estado: 'activo',
  motivoRechazo: null,
  fechaRegistro: '2025-01-15T10:00:00Z',
  fechaAprobacion: '2025-01-16T12:00:00Z',
  vehiculos: [
    {
      id: 'v1',
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2022,
      color: 'Blanco',
      placas: 'ABC-123',
      numeroSerie: null,
      esPrincipal: true,
    },
  ],
  documentos: [
    {
      id: 'd1',
      tipo: 'ine_frente',
      estado: 'aprobado',
      contentType: 'image/jpeg',
      fileSize: 1024,
      motivoRechazo: null,
      createdAt: '2025-01-15T10:00:00Z',
    },
  ],
  cupones: [],
};

describe('AsociadoDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner initially', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockReturnValue(new Promise(() => {}));
    vi.mocked(apiImageUrl).mockReturnValue(new Promise(() => {}));

    const { container } = render(<AsociadoDetailPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display asociado name and id', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/notas')) return Promise.resolve([]);
      return Promise.resolve(mockAsociado);
    });
    vi.mocked(apiImageUrl).mockRejectedValue(new Error('no photo'));

    render(<AsociadoDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Carlos García López/)).toBeInTheDocument();
      expect(screen.getByText(/A-001/)).toBeInTheDocument();
    });
  });

  it('should display estado badge', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/notas')) return Promise.resolve([]);
      return Promise.resolve(mockAsociado);
    });
    vi.mocked(apiImageUrl).mockRejectedValue(new Error('no photo'));

    render(<AsociadoDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('activo')).toBeInTheDocument();
    });
  });

  it('should display personal info section', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/notas')) return Promise.resolve([]);
      return Promise.resolve(mockAsociado);
    });
    vi.mocked(apiImageUrl).mockRejectedValue(new Error('no photo'));

    render(<AsociadoDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Datos Personales')).toBeInTheDocument();
      expect(screen.getByText('carlos@test.com')).toBeInTheDocument();
    });
  });

  it('should display vehicle info', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/notas')) return Promise.resolve([]);
      return Promise.resolve(mockAsociado);
    });
    vi.mocked(apiImageUrl).mockRejectedValue(new Error('no photo'));

    render(<AsociadoDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Toyota Corolla 2022/)).toBeInTheDocument();
      expect(screen.getByText(/ABC-123/)).toBeInTheDocument();
    });
  });

  it('should display documents section', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/notas')) return Promise.resolve([]);
      return Promise.resolve(mockAsociado);
    });
    vi.mocked(apiImageUrl).mockRejectedValue(new Error('no photo'));

    render(<AsociadoDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Documentos/)).toBeInTheDocument();
      expect(screen.getByText('ine frente')).toBeInTheDocument();
      expect(screen.getByText('aprobado')).toBeInTheDocument();
    });
  });

  it('should show "no encontrado" when asociado is null', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockRejectedValue(new Error('Not found'));
    vi.mocked(apiImageUrl).mockRejectedValue(new Error('no photo'));

    render(<AsociadoDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Asociado no encontrado')).toBeInTheDocument();
    });
  });

  it('should render volver button', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/notas')) return Promise.resolve([]);
      return Promise.resolve(mockAsociado);
    });
    vi.mocked(apiImageUrl).mockRejectedValue(new Error('no photo'));

    render(<AsociadoDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Volver')).toBeInTheDocument();
    });
  });

  it('should render timeline section', async () => {
    const { apiClient, apiImageUrl } = await import('@/lib/api-client');
    vi.mocked(apiClient).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/notas')) return Promise.resolve([]);
      return Promise.resolve(mockAsociado);
    });
    vi.mocked(apiImageUrl).mockRejectedValue(new Error('no photo'));

    render(<AsociadoDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Timeline/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Agregar nota interna...')).toBeInTheDocument();
    });
  });
});
