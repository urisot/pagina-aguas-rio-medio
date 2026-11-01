import { apiRequest, ApiError } from './apiClient.js';

/** Recibos vinculados al usuario: una entrada por cuenta con el recibo vigente y su saldo. */
export const obtenerCuentas = () => apiRequest('cuentas').then((data) => (Array.isArray(data) ? data : []));

export async function vincularCuenta(cuenta, titular) {
  if (!/^\d+$/.test(String(cuenta).trim())) {
    throw new ApiError('Escribe solo números, sin espacios ni guiones.', { code: 'VALIDATION' });
  }
  const data = await apiRequest('cuentas', { method: 'POST', body: { cuenta: String(cuenta).trim(), titular } });
  return Array.isArray(data) ? data : [];
}

export const desvincularCuenta = (idCuenta) => apiRequest(`cuentas/${idCuenta}`, { method: 'DELETE' });

export const obtenerCuenta = (idCuenta) => apiRequest(`cuentas/${idCuenta}`);

export const obtenerHistorialRecibos = (idCuenta) =>
  apiRequest(`cuentas/${idCuenta}/recibos`).then((data) => (Array.isArray(data) ? data : []));

export const obtenerHistorialPagos = (idCuenta) =>
  apiRequest(`cuentas/${idCuenta}/pagos`).then((data) => (Array.isArray(data) ? data : []));

export const obtenerConceptos = (idCuenta, idRecibo) =>
  idRecibo
    ? apiRequest(`cuentas/${idCuenta}/recibos/${encodeURIComponent(idRecibo)}/conceptos`).then((data) => (Array.isArray(data) ? data : []))
    : Promise.resolve([]);
