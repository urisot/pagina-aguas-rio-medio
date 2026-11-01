import { apiRequest } from './apiClient.js';

// Ids de estatus que asigna el WCF (mismos que estatus_reporte de la app).
export const ESTATUS = { ABIERTO: 64, CERRADO: 65, CANCELADO: 66, EN_SEGUIMIENTO: 80, EN_SUPERVISION: 108 };
export const PASOS = [ESTATUS.ABIERTO, ESTATUS.EN_SEGUIMIENTO, ESTATUS.EN_SUPERVISION, ESTATUS.CERRADO];

const NOMBRES = {
  [ESTATUS.ABIERTO]: 'Abierto',
  [ESTATUS.EN_SEGUIMIENTO]: 'En seguimiento',
  [ESTATUS.EN_SUPERVISION]: 'En supervisión',
  [ESTATUS.CERRADO]: 'Cerrado',
  [ESTATUS.CANCELADO]: 'Cancelado',
};

export const nombreEstatus = (id, respaldo = '') => NOMBRES[id] || respaldo || 'Desconocido';

export const claseEstatus = (id) => {
  if (id === ESTATUS.CERRADO) return 'badge-ok';
  if (id === ESTATUS.CANCELADO) return 'badge-error';
  if (id === ESTATUS.EN_SUPERVISION) return 'badge-warn';
  return 'badge-info';
};

export const esFinal = (id) => id === ESTATUS.CERRADO || id === ESTATUS.CANCELADO;

export const obtenerReportes = () => apiRequest('reportes').then((data) => (Array.isArray(data) ? data : []));

export const obtenerReporte = (folio) => apiRequest(`reportes/${encodeURIComponent(folio)}`);
