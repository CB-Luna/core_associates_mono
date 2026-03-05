import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/app/(auth)/login/page';

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should render login form with email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('should render all three preset user cards', () => {
    render(<LoginPage />);
    const buttons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.includes('AD') || btn.textContent?.includes('OP') || btn.textContent?.includes('PR'),
    );
    expect(buttons).toHaveLength(3);
    expect(screen.getByText('admin@coreassociates.com')).toBeInTheDocument();
    expect(screen.getByText('operador@coreassociates.com')).toBeInTheDocument();
    expect(screen.getByText('proveedor@elrapido.com')).toBeInTheDocument();
  });

  it('should fill form when preset user is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByText('admin@coreassociates.com'));

    await waitFor(() => {
      expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue('admin@coreassociates.com');
    });
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'invalid');
    await user.type(screen.getByLabelText(/contraseña/i), '12345678');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/correo electrónico inválido/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), '123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should call apiClient on valid submit', async () => {
    const user = userEvent.setup();
    const { apiClient } = await import('@/lib/api-client');
    const mockApiClient = vi.mocked(apiClient);
    mockApiClient.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: '1', email: 'a@b.c', nombre: 'Test', rol: 'admin' },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'admin@core.mx');
    await user.type(screen.getByLabelText(/contraseña/i), 'password1234');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('should display server error on failed login', async () => {
    const user = userEvent.setup();
    const { apiClient } = await import('@/lib/api-client');
    const mockApiClient = vi.mocked(apiClient);
    mockApiClient.mockRejectedValue(new Error('Credenciales inválidas'));

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'admin@core.mx');
    await user.type(screen.getByLabelText(/contraseña/i), 'password1234');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });
});
