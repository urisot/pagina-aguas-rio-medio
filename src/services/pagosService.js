import { apiRequest } from './apiClient.js';

/** Indica si el pago con tarjeta por YoLoPago ya está habilitado en el servidor. */
export const obtenerEstadoPago = () => apiRequest('pagos/yolopago').then((data) => Boolean(data?.habilitado));

/**
 * Prepara el pago de una cuenta. El monto lo calcula el servidor según `opcion` ("requerido" o "total").
 * Devuelve { monto, ordenCompra, portal: { accion, campos } } para abrir el portal de YoLoPago.
 */
export const iniciarPagoYoLoPago = (datos) => apiRequest('pagos/yolopago', { method: 'POST', body: datos });
