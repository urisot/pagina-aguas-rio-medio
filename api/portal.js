import { rutas } from './_rutas/index.js';

// Función de Vercel que atiende todo /api/*. vercel.json reescribe /api/<ruta> a /api/portal?ruta=<ruta>.
// Las carpetas con guion bajo (_lib, _rutas) no se publican como funciones.

const patron = (route) =>
  new RegExp(`^${route.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\w+)\}/g, '(?<$1>[^/]+)')}$`);

const tabla = rutas.map((r) => ({ ...r, regex: patron(r.route) }));

const contexto = {
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

const respuestaJson = (status, cuerpo) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/** Mismo formato que la librería de Azure Functions, que codifica el valor con encodeURIComponent. */
function serializarCookie({ name, value, maxAge, httpOnly, secure, sameSite, path }) {
  const partes = [`${name}=${encodeURIComponent(value)}`, `Path=${path || '/'}`];
  if (maxAge !== undefined) {
    partes.push(`Max-Age=${maxAge}`);
    if (maxAge <= 0) partes.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  }
  if (httpOnly) partes.push('HttpOnly');
  if (secure) partes.push('Secure');
  if (sameSite) partes.push(`SameSite=${sameSite}`);
  return partes.join('; ');
}

function rutaSolicitada(url) {
  const desdeQuery = url.searchParams.get('ruta');
  const valor = desdeQuery !== null ? desdeQuery : url.pathname.replace(/^\/api\/?/, '');
  return valor.replace(/^\/+|\/+$/g, '');
}

async function atender(request) {
  const url = new URL(request.url);
  const ruta = rutaSolicitada(url);

  let rutaExiste = false;
  for (const r of tabla) {
    const coincide = r.regex.exec(ruta);
    if (!coincide) continue;
    rutaExiste = true;
    if (!r.methods.includes(request.method)) continue;

    const params = {};
    for (const [nombre, valor] of Object.entries(coincide.groups || {})) {
      try {
        params[nombre] = decodeURIComponent(valor);
      } catch {
        params[nombre] = valor;
      }
    }

    const peticion = {
      method: request.method,
      headers: request.headers,
      params,
      json: () => request.json(),
    };
    const resultado = await r.handler(peticion, contexto);

    const headers = new Headers(resultado.headers || {});
    if (resultado.jsonBody !== undefined) headers.set('Content-Type', 'application/json; charset=utf-8');
    for (const c of resultado.cookies || []) headers.append('Set-Cookie', serializarCookie(c));
    const cuerpo = resultado.jsonBody !== undefined ? JSON.stringify(resultado.jsonBody) : null;
    return new Response(cuerpo, { status: resultado.status || 200, headers });
  }

  return rutaExiste
    ? respuestaJson(405, { error: 'Método no permitido.' })
    : respuestaJson(404, { error: 'No encontramos lo que buscabas.' });
}

export const GET = atender;
export const POST = atender;
export const DELETE = atender;
