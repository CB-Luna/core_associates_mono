const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { requireAuth = true, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders as Record<string, string>,
  };

  if (requireAuth) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    headers,
    ...rest,
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error del servidor' }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}
