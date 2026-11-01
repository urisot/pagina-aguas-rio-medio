import { ruta, json, leerJson, validarEntero, HttpError } from '../_lib/http.js';
import { llamarWcf, esExito } from '../_lib/wcf.js';
import { recibosDelUsuario, cuentaDelUsuario } from '../_lib/usuarios.js';
import * as normalizar from '../_lib/normalizar.js';

// El id del usuario siempre sale de la cookie de sesión; el navegador solo manda números de cuenta,
// y cada consulta por cuenta revisa antes que esté vinculada al usuario.

const idCuenta = (request) => validarEntero(request.params.idCuenta, 'Número de cuenta no válido.');

async function historialRecibos(id) {
  const data = await llamarWcf('LisHisRec', { body: { nIdCuenta: id } });
  return normalizar.lista(data).map(normalizar.historialRecibo);
}

ruta('cuentas', {
  methods: ['GET', 'POST'],
  route: 'cuentas',
  handler: async ({ request, usuario }) => {
    if (request.method === 'GET') {
      return json(200, await recibosDelUsuario(usuario.idUsuarioApp));
    }

    // Vincular un recibo: igual que AgregarReciboActivity (ValUsrPad → InsCuentasUsrApp).
    const body = await leerJson(request);
    const cuenta = validarEntero(body.cuenta, 'Escribe tu número de cuenta (solo números).');
    const titular = String(body.titular || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (!titular) throw new HttpError(400, 'Escribe el nombre del titular como aparece en tu recibo.');

    const actuales = await recibosDelUsuario(usuario.idUsuarioApp);
    if (actuales.some((r) => r.idCuenta === cuenta)) {
      throw new HttpError(409, 'Esta cuenta ya está vinculada a tu perfil.');
    }

    const validacion = await llamarWcf('ValUsrPad', { body: { nCuenta: cuenta, cNombre: titular } });
    if (!validacion?.UsrValido) {
      throw new HttpError(422, 'El número de cuenta y el nombre del titular no coinciden con nuestro padrón.');
    }

    const respuesta = await llamarWcf('InsCuentasUsrApp', { body: { cIdUsuarioApp: usuario.idUsuarioApp, nIdCueta: cuenta } });
    if (!esExito(respuesta)) {
      throw new HttpError(502, respuesta?.error_menssage || 'No pudimos vincular la cuenta. Intenta de nuevo.');
    }
    return json(201, await recibosDelUsuario(usuario.idUsuarioApp));
  },
});

ruta('cuenta', {
  methods: ['GET', 'DELETE'],
  route: 'cuentas/{idCuenta}',
  handler: async ({ request, usuario }) => {
    const id = idCuenta(request);
    const vinculada = await cuentaDelUsuario(usuario.idUsuarioApp, id);

    if (request.method === 'DELETE') {
      const respuesta = await llamarWcf('DelCuentasUsrApp', { body: { cIdUsuarioApp: usuario.idUsuarioApp, nIdCueta: id } });
      if (!esExito(respuesta)) {
        throw new HttpError(502, respuesta?.error_menssage || 'No pudimos quitar la cuenta. Intenta de nuevo.');
      }
      return json(200, { ok: true });
    }

    // GetDatPad trae lecturas y medidor; si no responde, se usa el resumen de LisRecUsrApp.
    const raw = await llamarWcf('GetDatPad', { body: { nCuenta: id } });
    const datos = raw && raw.id_cuenta ? normalizar.padron(raw) : vinculada;
    return json(200, { ...vinculada, ...datos, idRecibo: datos.idRecibo || vinculada.idRecibo });
  },
});

ruta('cuentaRecibos', {
  methods: ['GET'],
  route: 'cuentas/{idCuenta}/recibos',
  handler: async ({ request, usuario }) => {
    const id = idCuenta(request);
    await cuentaDelUsuario(usuario.idUsuarioApp, id);
    return json(200, await historialRecibos(id));
  },
});

ruta('cuentaPagos', {
  methods: ['GET'],
  route: 'cuentas/{idCuenta}/pagos',
  handler: async ({ request, usuario }) => {
    const id = idCuenta(request);
    await cuentaDelUsuario(usuario.idUsuarioApp, id);
    const data = await llamarWcf('LisHisPag', { body: { nIdCuenta: id } });
    return json(200, normalizar.lista(data).map(normalizar.historialPago));
  },
});

ruta('cuentaConceptos', {
  methods: ['GET'],
  route: 'cuentas/{idCuenta}/recibos/{idRecibo}/conceptos',
  handler: async ({ request, usuario }) => {
    const id = idCuenta(request);
    const idRecibo = String(request.params.idRecibo || '').trim();
    const cuenta = await cuentaDelUsuario(usuario.idUsuarioApp, id);

    // El recibo debe ser de esta cuenta: el vigente o uno de su historial.
    if (idRecibo !== cuenta.idRecibo) {
      const historial = await historialRecibos(id);
      if (!historial.some((r) => r.idRecibo === idRecibo)) {
        throw new HttpError(404, 'No encontramos ese recibo en tu cuenta.');
      }
    }

    const data = await llamarWcf('DetUsrRec', { body: { cIdRecibo: idRecibo } });
    return json(200, normalizar.lista(data).map(normalizar.concepto));
  },
});
