const BASE_URL = (import.meta.env.PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 20000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const isApiConfigured = () => BASE_URL !== '';

/**
 * Cliente único para el backend. Los componentes nunca llaman a fetch directamente.
 * @param {string} path Ruta relativa al servicio (por ejemplo "getDatosPadron").
 * @param {{method?: string, params?: Record<string, string|number>, body?: object, baseUrl?: string}} options
 */
export async function apiRequest(path, { method = 'GET', params, body, baseUrl = BASE_URL } = {}) {
  if (!baseUrl) {
    throw new ApiError('El servicio no está configurado todavía. Intenta más tarde o contáctanos.', { code: 'NOT_CONFIGURED' });
  }

  const url = new URL(`${baseUrl}/${path.replace(/^\//, '')}`);
  Object.entries(params || {}).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError('El servidor no pudo procesar la solicitud. Intenta de nuevo en unos minutos.', {
        status: response.status,
        code: 'HTTP_ERROR',
      });
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError('La consulta tardó demasiado. Revisa tu conexión e intenta de nuevo.', { code: 'TIMEOUT' });
    }
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.', { code: 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }
}
