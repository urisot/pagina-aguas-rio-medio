import { apiRequest, ApiError } from './apiClient.js';

const ENDPOINT = import.meta.env.PUBLIC_CONTACT_ENDPOINT || '';

async function enviar(tipo, datos) {
  if (!ENDPOINT) {
    throw new ApiError('Este formulario aún no está habilitado. Escríbenos por WhatsApp o correo electrónico.', {
      code: 'NOT_CONFIGURED',
    });
  }
  // Se envía la ruta completa como base para no depender de PUBLIC_API_BASE_URL.
  return apiRequest('', { method: 'POST', baseUrl: ENDPOINT, body: { tipo, ...datos } });
}

export const enviarMensajeContacto = (datos) => enviar('contacto', datos);
export const solicitarEliminacionCuenta = (datos) => enviar('eliminacion-cuenta', datos);
