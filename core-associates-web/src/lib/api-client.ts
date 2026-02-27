const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3501';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { requireAuth = true, headers: customHeaders, body, ...rest } = options;

  const headers: Record<string, string> = {};

  // Only set Content-Type for non-FormData bodies
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  Object.assign(headers, customHeaders as Record<string, string>);

  if (requireAuth) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    headers,
    body,
    ...rest,
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error del servidor' }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  // Handle empty responses (204 No Content)
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Paginated response helper
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
