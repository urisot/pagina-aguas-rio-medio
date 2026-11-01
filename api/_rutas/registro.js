import { ruta, json, error, leerJson, validarCorreo, HttpError } from '../_lib/http.js';
import { llamarWcf, esExito } from '../_lib/wcf.js';
import {
  cookie, borrarCookie, cookiesSesion, firmar, verificar, leerCookie,
  hashContrasena, huellaCodigo, codigoNumerico,
} from '../_lib/sesion.js';
import { validarContrasenaNueva } from '../_lib/usuarios.js';
import * as normalizar from '../_lib/normalizar.js';

// Registro en dos pasos, igual que la app (RegistroPideDatos → RegistroPideCodigo), pero el código
// se genera y se valida aquí: el navegador nunca lo conoce. Los datos viajan en una cookie firmada.
const COOKIE_REGISTRO = 'arm_registro';
const DURACION_REGISTRO_S = 15 * 60;
const ESPERA_REENVIO_MS = 60 * 1000;
const MAX_INTENTOS = 5;

const limpiar = (valor, max) => String(valor || '').replace(/\s+/g, ' ').trim().slice(0, max);

function validarDatos(body) {
  const nombres = limpiar(body.nombres, 60);
  const apellidos = limpiar(body.apellidos, 60);
  const celular = String(body.celular || '').replace(/\D/g, '');
  if (!nombres) throw new HttpError(400, 'Escribe tu nombre.');
  if (!apellidos) throw new HttpError(400, 'Escribe tus apellidos.');
  if (celular.length !== 10) throw new HttpError(400, 'Escribe tu celular a 10 dígitos.');
  return { nombres, apellidos, celular, correo: validarCorreo(body.correo) };
}

async function enviarCodigo(datos) {
  const codigo = codigoNumerico();
  const respuesta = await llamarWcf('EnvCodEmail', {
    conPass: false,
    body: { cEmailAEnviar: datos.correo, cTitular: `${datos.nombres} ${datos.apellidos}`, cCodigo: codigo },
  });
  if (!esExito(respuesta)) {
    throw new HttpError(502, 'No pudimos enviar el correo con tu código. Revisa tu correo e intenta de nuevo.');
  }
  return huellaCodigo(datos.correo, codigo);
}

const cookieRegistro = (registro) => cookie(COOKIE_REGISTRO, firmar(registro, DURACION_REGISTRO_S), DURACION_REGISTRO_S);

ruta('registroCodigo', {
  methods: ['POST'],
  route: 'registro/codigo',
  sesion: false,
  handler: async ({ request }) => {
    const body = await leerJson(request);
    const datos = validarDatos(body);
    const contrasena = validarContrasenaNueva(body.contrasena);
    if (!body.aceptaPrivacidad) throw new HttpError(400, 'Debes aceptar el aviso de privacidad.');

    const anterior = verificar(leerCookie(request, COOKIE_REGISTRO));
    if (anterior && anterior.correo === datos.correo && Date.now() - anterior.enviado < ESPERA_REENVIO_MS) {
      throw new HttpError(429, 'Espera un minuto antes de pedir otro código.');
    }

    const huella = await enviarCodigo(datos);
    const registro = { ...datos, hash: hashContrasena(datos.correo, contrasena), huella, enviado: Date.now(), intentos: 0 };
    return json(200, { correo: datos.correo }, [cookieRegistro(registro)]);
  },
});

ruta('registroReenviar', {
  methods: ['POST'],
  route: 'registro/reenviar',
  sesion: false,
  handler: async ({ request }) => {
    const registro = verificar(leerCookie(request, COOKIE_REGISTRO));
    if (!registro) return error(410, 'Tu registro venció. Llena tus datos de nuevo.');
    if (Date.now() - registro.enviado < ESPERA_REENVIO_MS) {
      throw new HttpError(429, 'Espera un minuto antes de pedir otro código.');
    }
    const huella = await enviarCodigo(registro);
    return json(200, { correo: registro.correo }, [cookieRegistro({ ...registro, huella, enviado: Date.now(), intentos: 0 })]);
  },
});

ruta('registroConfirmar', {
  methods: ['POST'],
  route: 'registro/confirmar',
  sesion: false,
  handler: async ({ request }) => {
    const registro = verificar(leerCookie(request, COOKIE_REGISTRO));
    if (!registro) return error(410, 'Tu registro venció. Llena tus datos de nuevo.');

    const body = await leerJson(request);
    const codigo = String(body.codigo || '').trim();
    if (registro.intentos >= MAX_INTENTOS) {
      return error(429, 'Superaste los intentos permitidos. Pide un código nuevo.', [borrarCookie(COOKIE_REGISTRO)]);
    }
    if (!/^\d{6}$/.test(codigo) || huellaCodigo(registro.correo, codigo) !== registro.huella) {
      return error(400, 'El código no es correcto.', [cookieRegistro({ ...registro, intentos: registro.intentos + 1 })]);
    }

    const respuesta = await llamarWcf('InsUsrApp', {
      conPass: false,
      body: {
        cNombre: `${registro.nombres} ${registro.apellidos}`,
        cPrimerNombre: registro.nombres,
        cApellidos: registro.apellidos,
        cMail: registro.correo,
        cCelular: registro.celular,
        cContrasena: registro.hash,
        cMacAdres: 'WEB',
        cImagen: '',
      },
    });
    if (!esExito(respuesta)) {
      // El SP devuelve el motivo (por ejemplo, correo ya registrado).
      return error(409, respuesta?.error_menssage || 'No pudimos crear tu cuenta. Intenta de nuevo.');
    }

    // Inicia sesión con el mismo hash que se acaba de guardar.
    const raw = await llamarWcf('ValidaUsrAppPruebas', { conPass: false, body: { cMail: registro.correo, cContrasena: registro.hash } });
    const cookies = [borrarCookie(COOKIE_REGISTRO)];
    if (!raw || !raw.id_usuarioapp) return json(201, { iniciarSesion: true }, cookies);
    const usuario = normalizar.perfil(raw);
    return json(201, normalizar.perfilPublico(usuario), [...cookies, ...cookiesSesion(usuario, registro.hash)]);
  },
});
