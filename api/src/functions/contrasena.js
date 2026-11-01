import { ruta, json, leerJson, validarCorreo } from '../lib/http.js';
import { llamarWcf } from '../lib/wcf.js';
import { contrasenaTemporal } from '../lib/sesion.js';

// Igual que la app (ResConPideEmailFragment): CamConEmail guarda SHA1(correo + clave) como contraseña
// y envía la clave temporal por correo. No hay paso de confirmación en el WCF.
ruta('contrasenaRestablecer', {
  methods: ['POST'],
  route: 'contrasena/restablecer',
  sesion: false,
  handler: async ({ request, context }) => {
    const body = await leerJson(request);
    const correo = validarCorreo(body.correo);
    const respuesta = await llamarWcf('CamConEmail', {
      conPass: false,
      body: { cEmailAEnviar: correo, cCodigo: contrasenaTemporal() },
    });
    if (Number(respuesta?.error_number) !== 0) context.warn(`CamConEmail sin éxito: ${respuesta?.error_menssage || 'sin respuesta'}`);
    // Mismo mensaje exista o no el correo, para no revelar qué correos están registrados.
    return json(200, { ok: true });
  },
});
