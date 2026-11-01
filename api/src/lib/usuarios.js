import { HttpError } from './http.js';
import { llamarWcf } from './wcf.js';
import { hashContrasena } from './sesion.js';
import * as normalizar from './normalizar.js';

// ValidaUsrApp está deshabilitada en el WCF; la app y el sitio usan ValidaUsrAppPruebas.
// Devuelve la llave `key` y el hash de la contraseña: se descartan aquí y nunca llegan al navegador.
async function validarRaw(correo, hash) {
  const raw = await llamarWcf('ValidaUsrAppPruebas', { conPass: false, body: { cMail: correo, cContrasena: hash } });
  return raw && raw.id_usuarioapp ? raw : null;
}

/** Valida con el hash ya calculado. Devuelve { perfil, imagen } o null. */
export async function validarConHash(correo, hash) {
  const raw = await validarRaw(correo, hash);
  if (!raw) return null;
  return { perfil: normalizar.perfil(raw), imagen: String(raw.imagen || '').trim() };
}

export async function validarUsuario(correo, contrasena) {
  const resultado = await validarConHash(correo, hashContrasena(correo, contrasena));
  return resultado ? resultado.perfil : null;
}

export function validarContrasenaNueva(valor) {
  const contrasena = String(valor || '');
  if (contrasena.length < 8 || !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
    throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres, con letras y números.');
  }
  return contrasena;
}

/**
 * Recibos y reportes del usuario desde DatUsrApp (usp_Qry_DatosUsrApp), la misma fuente que usa la app.
 * No usar LisRecUsrApp: su SP (usp_Qry_ReciboUsrApp) devuelve total, vencido y meses_rezago en cero.
 * Las tarjetas guardadas que también trae se descartan.
 */
export async function datosDelUsuario(idUsuarioApp) {
  const data = await llamarWcf('DatUsrApp', { body: { cIdUsuarioApp: idUsuarioApp } });
  return {
    recibos: normalizar.lista(data?.recibos).filter((r) => r && r.id_cuenta).map(normalizar.reciboUsuario),
    reportes: normalizar.lista(data?.reportes).filter((r) => r && r.folio_reporte).map(normalizar.reporte),
  };
}

/** Recibos vinculados al usuario (una fila por cuenta, con el recibo vigente). */
export const recibosDelUsuario = async (idUsuarioApp) => (await datosDelUsuario(idUsuarioApp)).recibos;

/** Lanza 404 si la cuenta no está vinculada al usuario: evita consultar cuentas ajenas. */
export async function cuentaDelUsuario(idUsuarioApp, idCuenta) {
  const recibos = await recibosDelUsuario(idUsuarioApp);
  const cuenta = recibos.find((r) => r.idCuenta === idCuenta);
  if (!cuenta) throw new HttpError(404, 'No encontramos esa cuenta entre tus recibos.');
  return cuenta;
}
