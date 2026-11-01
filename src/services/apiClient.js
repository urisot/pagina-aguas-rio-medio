// Todo el acceso al backend pasa por el proxy /api (Azure Functions), que es el único que conoce la llave del WCF.
const BASE_URL = '/api';
const TIMEOUT_MS = 25000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const codigoPorEstado = (status) => {
  if (status === 401) return 'SESION';
  if (status === 404) return 'NOT_FOUND';
  if (status >= 400 && status < 500) return 'VALIDATION';
  return 'HTTP_ERROR';
};

/**
 * Cliente único para el API. Los componentes nunca llaman a fetch directamente.
 * @param {string} path Ruta relativa al API (por ejemplo "cuentas").
 * @param {{method?: string, body?: object, baseUrl?: string}} options
 */
export async function apiRequest(path, { method = 'GET', body, baseUrl = BASE_URL } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/${path.replace(/^\//, '')}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'arm-web',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new ApiError(data?.error || 'El servidor no pudo procesar la solicitud. Intenta de nuevo en unos minutos.', {
        status: response.status,
        code: codigoPorEstado(response.status),
      });
    }
    return data;
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
