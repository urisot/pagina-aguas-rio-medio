const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Convierte las fechas del WCF ("23/Octubre/2026" o "23/10/2026") a Date; null si no se reconoce. */
export function parseFecha(texto) {
  const partes = String(texto || '').trim().split(/[/\-\s]+/);
  if (partes.length !== 3) return null;
  const dia = Number.parseInt(partes[0], 10);
  const mes = /^\d+$/.test(partes[1]) ? Number.parseInt(partes[1], 10) - 1 : MESES.indexOf(partes[1].toLowerCase());
  const anio = Number.parseInt(partes[2], 10);
  if (!dia || mes < 0 || mes > 11 || !anio) return null;
  return new Date(anio, mes, dia, 23, 59, 59);
}

/** Vencido si el WCF lo marca o si la fecha de vencimiento ya pasó y hay saldo. */
export function estaVencido(c) {
  if (c.vencido) return true;
  const fecha = parseFecha(c.fechaVencimiento);
  return Boolean(fecha) && c.total > 0 && fecha < new Date();
}

/** Badge de estado de una cuenta según su saldo, vencimiento y meses de rezago. */
export default function estadoCuenta(c) {
  if (c.total <= 0) return { texto: 'Al corriente', clase: 'badge-ok' };
  if (c.mesesRezago > 0) return { texto: `${c.mesesRezago} mes(es) de rezago`, clase: 'badge-warn' };
  if (estaVencido(c)) return { texto: 'Vencido', clase: 'badge-error' };
  return { texto: 'Saldo pendiente', clase: 'badge-info' };
}
