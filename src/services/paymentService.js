import { apiRequest, ApiError } from './apiClient.js';

/*
  Endpoints WCF usados (webHttp, sin llave `pass`):
    GET getDatosPadron?p1={cuenta}     -> datos de cuenta y adeudo
    GET getHistorialRecibos?p1={cuenta} -> recibos emitidos
    GET getDetalleRecibo?p1={idRecibo}  -> conceptos del recibo
  El pago (GenCargoYP / ActualizarCargoYP) NO se implementa: exige la llave compartida pass. Ver CLAUDE.md.
*/


const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizarCuenta = (raw) => ({
  idCuenta: toNumber(raw.id_cuenta),
  titular: (raw.razon_social || '').trim(),
  direccion: [raw.direccion, raw.colonia, raw.poblacion].filter(Boolean).join(', '),
  servicio: raw.servicio || '',
  tarifa: raw.tarifa || '',
  estatus: raw.estatus || '',
  periodo: raw.periodo || '',
  fechaFactura: raw.fecha_factura_act || '',
  fechaVencimiento: raw.fecha_vencimiento || '',
  mesesRezago: toNumber(raw.meses_rezago),
  consumo: toNumber(raw.consumo_act),
  total: toNumber(raw.total),
  pagoRequerido: toNumber(raw.pago_requerido),
  idRecibo: raw.id_recibo || '',
});

const normalizarConcepto = (raw) => ({
  id: raw.id,
  concepto: raw.concepto,
  esRezago: Boolean(raw.es_rezago),
  subtotal: toNumber(raw.subtotal),
  iva: toNumber(raw.iva),
  total: toNumber(raw.total),
});

const normalizarRecibo = (raw) => ({
  idRecibo: raw.id_recibo,
  ciclo: raw.ciclo_facturado,
  periodo: raw.periodo,
  consumo: toNumber(raw.consumo),
  total: toNumber(raw.total),
});

export async function consultarCuenta(numeroCuenta) {
  const cuenta = Number.parseInt(numeroCuenta, 10);
  if (!Number.isInteger(cuenta) || cuenta <= 0) {
    throw new ApiError('Ingresa un número de cuenta válido (solo números).', { code: 'VALIDATION' });
  }
  const data = await apiRequest('getDatosPadron', { params: { p1: cuenta } });
  // getDatosPadron devuelve una fila por recibo pendiente (de más antiguo a más reciente);
  // el total y los datos de la cuenta se repiten en todas las filas.
  const filas = (Array.isArray(data) ? data : [data]).filter((fila) => fila && fila.id_cuenta);
  const raw = filas[filas.length - 1];
  if (!raw) {
    throw new ApiError('No encontramos una cuenta con ese número. Verifica el dato en tu recibo.', { code: 'NOT_FOUND' });
  }
  return {
    ...normalizarCuenta(raw),
    recibosPendientes: filas.map((fila) => ({ idRecibo: fila.id_recibo, ciclo: fila.ciclo_facturado, periodo: fila.periodo })).reverse(),
  };
}

export async function obtenerHistorialRecibos(idCuenta) {
  const data = await apiRequest('getHistorialRecibos', { params: { p1: idCuenta } });
  return (Array.isArray(data) ? data : []).map(normalizarRecibo);
}

export async function obtenerDetalleRecibo(idRecibo) {
  if (!idRecibo) return [];
  const data = await apiRequest('getDetalleRecibo', { params: { p1: idRecibo } });
  return (Array.isArray(data) ? data : []).map(normalizarConcepto);
}
