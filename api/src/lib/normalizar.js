// Convierte las respuestas del WCF al formato que consume el sitio y descarta campos internos.

const texto = (valor) => (valor === null || valor === undefined ? '' : String(valor).trim());

const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const lista = (valor) => (Array.isArray(valor) ? valor : []);

export const perfil = (raw) => ({
  idUsuarioApp: texto(raw.id_usuarioapp),
  nombre: texto(raw.nombre).replace(/\+/g, ' '),
  nombres: texto(raw.nombres),
  apellidos: texto(raw.apellidos),
  correo: texto(raw.mail),
  celular: texto(raw.celular),
});

// Lo que ve el navegador: sin el id interno del usuario.
export const perfilPublico = ({ nombre, nombres, apellidos, correo, celular }) => ({ nombre, nombres, apellidos, correo, celular });

const direccion = (raw) => [texto(raw.direccion), texto(raw.colonia), texto(raw.poblacion)].filter(Boolean).join(', ');

/** clsDatosPadron.o_DatosReciboUsrApp (LisRecUsrApp / DatUsrApp). */
export const reciboUsuario = (raw) => ({
  idCuenta: numero(raw.id_cuenta),
  idRecibo: texto(raw.id_recibo),
  titular: texto(raw.razon_social),
  direccion: direccion(raw),
  servicio: texto(raw.servicio),
  tarifa: texto(raw.tarifa),
  estatus: texto(raw.estatus),
  ciclo: texto(raw.ciclo_facturado),
  periodo: texto(raw.periodo),
  fechaFactura: texto(raw.fecha_factura_act),
  fechaVencimiento: texto(raw.fecha_vencimiento),
  mesesRezago: numero(raw.meses_rezago),
  consumo: numero(raw.consumo_act),
  promedio: numero(raw.promedio_act),
  total: numero(raw.total),
  pagoRequerido: numero(raw.pago_requerido),
  vencido: numero(raw.vencido) > 0,
});

/** clsDatosPadron.o_DatosPadron (GetDatPad). */
export const padron = (raw) => ({
  ...reciboUsuario(raw),
  idMedidor: texto(raw.id_medidor),
  localizacion: texto(raw.localizacion),
  lecturaActual: numero(raw.lectura_act),
  lecturaAnterior: numero(raw.lectura_ant),
  fechaLecturaActual: texto(raw.fecha_lectura_act),
  fechaLecturaAnterior: texto(raw.fecha_lectura_ant),
});

/** clsHistorialRecibos.o_HistorialRecibo (LisHisRec). */
export const historialRecibo = (raw) => ({
  idRecibo: texto(raw.id_recibo),
  ciclo: texto(raw.ciclo_facturado),
  periodo: texto(raw.periodo),
  consumo: numero(raw.consumo),
  total: numero(raw.total),
});

/** clsHistorialRecibos.o_HistorialPagos (LisHisPag). */
export const historialPago = (raw) => ({
  id: numero(raw.id),
  folio: texto(raw.folio),
  fecha: texto(raw.fecha),
  estatus: texto(raw.estatus),
  formaPago: texto(raw.formapago),
  caja: texto(raw.caja),
  total: numero(raw.total),
});

/** clsDetalleRecibo.o_DetalleRecibo (DetUsrRec). */
export const concepto = (raw) => ({
  id: numero(raw.id),
  concepto: texto(raw.concepto),
  esRezago: Boolean(raw.es_rezago),
  subtotal: numero(raw.subtotal),
  iva: numero(raw.iva),
  total: numero(raw.total),
});

/** clsDatosPadron.o_reporte (DatUsrApp). La foto se omite en la lista; viene en el detalle. */
export const reporte = (raw) => ({
  folio: texto(raw.folio_reporte),
  tipo: texto(raw.reporte),
  fecha: texto(raw.fecha),
  idEstatus: numero(raw.id_estatus),
  estatus: texto(raw.estatus),
  idCuenta: numero(raw.id_cuenta),
  latitud: numero(raw.gps_latitud),
  longitud: numero(raw.gps_longitud),
});

/** clsReportes.o_HisReporte (LisHisRpt). */
export const pasoReporte = (raw) => ({
  idEstatus: numero(raw.id_estatus),
  estatus: texto(raw.estatus),
  fecha: texto(raw.fecha),
  comentario: texto(raw.comentario),
});

export { lista };
