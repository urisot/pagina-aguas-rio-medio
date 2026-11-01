import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const COOKIE_SESION = 'arm_sesion';
// Cookie legible por JavaScript solo para pintar "Mi cuenta" en el header sin llamar al API. No da acceso a nada.
export const COOKIE_NOMBRE = 'arm_nombre';
export const DURACION_SESION_S = 8 * 60 * 60;

function secreto() {
  const valor = process.env.SESSION_SECRET || '';
  if (valor.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
  return valor;
}

const hmac = (texto) => createHmac('sha256', secreto()).update(texto).digest('base64url');

const llaveCifrado = () => createHash('sha256').update(`cifrado|${secreto()}`).digest();

/** AES-256-GCM para valores que viajan en la cookie y el navegador no debe poder leer. */
export function cifrar(texto) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', llaveCifrado(), iv);
  const datos = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), datos]).toString('base64url');
}

export function descifrar(valor) {
  try {
    const buffer = Buffer.from(valor || '', 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', llaveCifrado(), buffer.subarray(0, 12));
    decipher.setAuthTag(buffer.subarray(12, 28));
    return Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

/** Serializa y firma un objeto con vencimiento. El contenido es legible: no guardar secretos. */
export function firmar(datos, duracionSegundos) {
  const cuerpo = Buffer.from(JSON.stringify({ ...datos, exp: Date.now() + duracionSegundos * 1000 })).toString('base64url');
  return `${cuerpo}.${hmac(cuerpo)}`;
}

/** Devuelve el objeto firmado o null si la firma no coincide o ya venció. */
export function verificar(valor) {
  const [cuerpo, firma] = (valor || '').split('.');
  if (!cuerpo || !firma) return null;
  const recibida = Buffer.from(firma);
  const esperada = Buffer.from(hmac(cuerpo));
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
    return datos.exp > Date.now() ? datos : null;
  } catch {
    return null;
  }
}

export function leerCookie(request, nombre) {
  const header = request.headers.get('cookie') || '';
  const par = header.split(';').map((p) => p.trim()).find((p) => p.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : '';
}

export const cookie = (name, value, maxAge, httpOnly = true) => ({
  name,
  value,
  maxAge,
  httpOnly,
  secure: true,
  sameSite: 'Strict',
  path: '/',
});

export const borrarCookie = (name, httpOnly = true) => cookie(name, '', 0, httpOnly);

/**
 * Sesión del usuario: perfil público, su id del WCF y el hash de la contraseña cifrado (`ch`),
 * que solo sirve para volver a pedir datos que el WCF entrega únicamente al validar (la foto de perfil).
 * Nunca la llave del WCF.
 */
export function cookiesSesion(perfil, hash) {
  const { exp, ...datos } = perfil;
  const sesion = { ...datos, ch: hash ? cifrar(hash) : datos.ch };
  return [
    cookie(COOKIE_SESION, firmar(sesion, DURACION_SESION_S), DURACION_SESION_S),
    cookie(COOKIE_NOMBRE, encodeURIComponent(perfil.nombres || perfil.nombre || 'Mi cuenta'), DURACION_SESION_S, false),
  ];
}

export const cookiesCerrarSesion = () => [borrarCookie(COOKIE_SESION), borrarCookie(COOKIE_NOMBRE, false)];

export const leerSesion = (request) => verificar(leerCookie(request, COOKIE_SESION));

/** Mismo hash que la app (Util.HashContrasena): SHA1(correo + contraseña) en mayúsculas. */
export const hashContrasena = (correo, contrasena) =>
  createHash('sha1').update(`${correo}${contrasena}`, 'utf8').digest('hex').toUpperCase();

/** Huella de un código de verificación ligada al correo, para guardarla en una cookie sin revelar el código. */
export const huellaCodigo = (correo, codigo) => hmac(`${correo.toLowerCase()}|${codigo}`);

export const codigoNumerico = (digitos = 6) => String(randomInt(0, 10 ** digitos)).padStart(digitos, '0');

const ALFABETO = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const contrasenaTemporal = (largo = 8) =>
  Array.from({ length: largo }, () => ALFABETO[randomInt(0, ALFABETO.length)]).join('');
