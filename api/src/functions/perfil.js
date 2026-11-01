import { ruta, json, leerJson, HttpError } from '../lib/http.js';
import { llamarWcf, esExito } from '../lib/wcf.js';
import { hashContrasena, cookiesSesion, descifrar } from '../lib/sesion.js';
import { validarUsuario, validarConHash, validarContrasenaNueva } from '../lib/usuarios.js';

// Foto de perfil (Base64): el WCF solo la entrega en ValidaUsrAppPruebas, así que se vuelve a validar
// con el hash cifrado que guarda la sesión. Si la contraseña cambió desde otro lado, no hay foto.
ruta('perfilImagen', {
  methods: ['GET'],
  route: 'perfil/imagen',
  handler: async ({ usuario }) => {
    const hash = descifrar(usuario.ch);
    const resultado = hash ? await validarConHash(usuario.correo, hash) : null;
    const imagen = resultado && resultado.perfil.idUsuarioApp === usuario.idUsuarioApp ? resultado.imagen : '';
    return json(200, { imagen });
  },
});

// Cambio de contraseña: se confirma la actual con ValidaUsrAppPruebas y se guarda el hash nuevo
// con ActConUsrApp, que almacena el valor tal cual (por eso se manda ya con el hash de la app).
ruta('perfilContrasena', {
  methods: ['POST'],
  route: 'perfil/contrasena',
  handler: async ({ request, usuario }) => {
    const body = await leerJson(request);
    const actual = String(body.actual || '');
    const nueva = validarContrasenaNueva(body.nueva);
    if (!actual) throw new HttpError(400, 'Escribe tu contraseña actual.');
    if (actual === nueva) throw new HttpError(400, 'La contraseña nueva debe ser distinta de la actual.');

    const valido = await validarUsuario(usuario.correo, actual);
    if (!valido || valido.idUsuarioApp !== usuario.idUsuarioApp) {
      throw new HttpError(400, 'Tu contraseña actual no es correcta.');
    }

    const hashNuevo = hashContrasena(usuario.correo, nueva);
    const respuesta = await llamarWcf('ActConUsrApp', {
      body: { cIdUsuarioApp: usuario.idUsuarioApp, cContrasena: hashNuevo },
    });
    if (!esExito(respuesta)) {
      throw new HttpError(502, respuesta?.error_menssage || 'No pudimos cambiar tu contraseña. Intenta de nuevo.');
    }
    // Se renueva la sesión con el hash nuevo para que la foto de perfil se siga pudiendo consultar.
    return json(200, { ok: true }, cookiesSesion(usuario, hashNuevo));
  },
});
