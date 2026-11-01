import { app } from '@azure/functions';
import { leerSesion } from './sesion.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const json = (status, jsonBody, cookies) => ({
  status,
  jsonBody,
  cookies,
  headers: { 'Cache-Control': 'no-store' },
});

export const error = (status, mensaje, cookies) => json(status, { error: mensaje }, cookies);

export async function leerJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

// Correo sin comillas ni espacios: el WCF concatena el correo en SQL al validar el usuario.
const REGEX_CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function validarCorreo(valor) {
  const correo = String(valor || '').trim();
  if (!REGEX_CORREO.test(correo) || correo.length > 100) {
    throw new HttpError(400, 'Escribe un correo electrónico válido.');
  }
  return correo;
}

export function validarEntero(valor, mensaje) {
  const numero = Number.parseInt(valor, 10);
  if (!Number.isInteger(numero) || numero <= 0 || String(numero) !== String(valor).trim()) {
    throw new HttpError(400, mensaje);
  }
  return numero;
}

/**
 * Registra una ruta /api/{route}.
 * - Las peticiones que cambian datos deben traer el header X-Requested-With: arm-web. Un sitio ajeno
 *   no puede mandarlo sin un preflight CORS, que este API no autoriza (protección CSRF junto con SameSite=Strict).
 * - Con `sesion: true` responde 401 si no hay cookie de sesión válida y pasa el usuario al handler.
 */
export function ruta(nombre, { methods, route, sesion = true, handler }) {
  app.http(nombre, {
    methods,
    route,
    authLevel: 'anonymous',
    handler: async (request, context) => {
      try {
        if (request.method !== 'GET' && request.headers.get('x-requested-with') !== 'arm-web') {
          return error(403, 'Solicitud no permitida.');
        }
        const usuario = sesion ? leerSesion(request) : null;
        if (sesion && !usuario) {
          return error(401, 'Tu sesión terminó. Inicia sesión de nuevo.');
        }
        return await handler({ request, usuario, context });
      } catch (err) {
        if (err instanceof HttpError) return error(err.status, err.message);
        context.error(err);
        return error(500, 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.');
      }
    },
  });
}
