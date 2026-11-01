import { ruta, json, error, leerJson, validarCorreo, HttpError } from '../_lib/http.js';
import { cookiesSesion, cookiesCerrarSesion, hashContrasena } from '../_lib/sesion.js';
import { validarConHash } from '../_lib/usuarios.js';
import * as normalizar from '../_lib/normalizar.js';

ruta('authLogin', {
  methods: ['POST'],
  route: 'auth/login',
  sesion: false,
  handler: async ({ request }) => {
    const body = await leerJson(request);
    const correo = validarCorreo(body.correo);
    const contrasena = String(body.contrasena || '');
    if (!contrasena) throw new HttpError(400, 'Escribe tu contraseña.');

    const hash = hashContrasena(correo, contrasena);
    const resultado = await validarConHash(correo, hash);
    if (!resultado) return error(401, 'El correo o la contraseña no son correctos.');
    return json(200, normalizar.perfilPublico(resultado.perfil), cookiesSesion(resultado.perfil, hash));
  },
});

ruta('authLogout', {
  methods: ['POST'],
  route: 'auth/logout',
  sesion: false,
  handler: async () => json(200, { ok: true }, cookiesCerrarSesion()),
});

ruta('authSesion', {
  methods: ['GET'],
  route: 'auth/sesion',
  handler: async ({ usuario }) => json(200, normalizar.perfilPublico(usuario)),
});
