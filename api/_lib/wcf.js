import { HttpError } from './http.js';

const TIMEOUT_MS = 20000;

const baseUrl = () => (process.env.WCF_BASE_URL || '').replace(/\/$/, '');

/**
 * Llama una operación del WCF ComapaVic_OS.svc. Es el único lugar que conoce la llave `pass`.
 * Las operaciones POST usan WrappedRequest: las llaves del body son los nombres de los parámetros VB.
 * @param {string} operacion Nombre de la operación (por ejemplo "LisRecUsrApp").
 * @param {{body?: object, conPass?: boolean, campoPass?: string}} options `campoPass` es el nombre del
 *   parámetro que recibe la llave (casi siempre "pass"; GenTok lo llama "c1").
 */
export async function llamarWcf(operacion, { body = {}, conPass = true, campoPass = 'pass' } = {}) {
  if (!baseUrl() || (conPass && !process.env.WCF_PASS)) {
    throw new HttpError(503, 'El servicio no está configurado todavía. Intenta más tarde o contáctanos.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl()}/${operacion}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(conPass ? { [campoPass]: process.env.WCF_PASS, ...body } : body),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new HttpError(502, 'El servidor no pudo procesar la solicitud. Intenta de nuevo en unos minutos.');
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error.name === 'AbortError') {
      throw new HttpError(504, 'La consulta tardó demasiado. Intenta de nuevo.');
    }
    throw new HttpError(502, 'No pudimos conectar con el servidor. Intenta de nuevo en unos minutos.');
  } finally {
    clearTimeout(timer);
  }
}

/** Respuesta estándar del WCF (clsRespuesta.o_respuesta): error_number 0 es éxito. */
export const esExito = (respuesta) => respuesta && Number(respuesta.error_number) === 0;
