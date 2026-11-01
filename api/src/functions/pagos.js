import { ruta, json, leerJson, validarEntero, validarCorreo, HttpError } from '../lib/http.js';
import { llamarWcf } from '../lib/wcf.js';
import { cuentaDelUsuario } from '../lib/usuarios.js';
import { cookie, cifrar } from '../lib/sesion.js';

// Pago con tarjeta por YoLoPago, igual que PagoTarjetaActivity (agregador 3) de la app:
//   1. GenTok (WCF) devuelve el token de pago (key_pago) y la orden de compra (folio_pago).
//   2. El navegador hace un POST de formulario al portal de YoLoPago (j_spring_security_check) con las
//      credenciales del comercio, el monto y los datos del titular en `params`; YoLoPago captura la tarjeta y 3DSecure.
//   3. YoLoPago entrega el resultado (en la app, por la interfaz JavaScript `yolopagoMobile.processPaymentResult`)
//      y se aplica el pago con AplPag.
//
// Mientras YOLOPAGO_HABILITADO no sea "true" solo se valida la solicitud y se responde 503, sin llamar a GenTok.
// No habilitarlo hasta resolver con YoLoPago y en el WCF (ver CLAUDE.md, "Pago con YoLoPago"):
//   - cómo devuelve el resultado a una página web (URL de retorno, postMessage o webhook);
//   - cómo validar el `hmac` del resultado, para no aplicar pagos con lo que diga el navegador;
//   - que las credenciales del comercio llegan al navegador en el formulario del paso 2.
// El paso 3 (confirmar y aplicar con AplPag) todavía no existe en este proxy.

const COOKIE_PAGO = 'arm_pago';
const DURACION_PAGO_S = 20 * 60;

const habilitado = () => process.env.YOLOPAGO_HABILITADO === 'true';

const formatoMonto = (valor) => (Math.round(valor * 100) / 100).toFixed(2);

function textoRequerido(valor, maximo, mensaje) {
  const texto = String(valor || '').replace(/\s+/g, ' ').trim();
  if (!texto || texto.length > maximo) throw new HttpError(400, mensaje);
  return texto;
}

/** Datos del titular que pide YoLoPago (ValidaInformacionClienteYLP en la app). */
function validarTitular(body) {
  const telefono = String(body.telefono || '').replace(/\D/g, '');
  if (telefono.length !== 10) throw new HttpError(400, 'Escribe un teléfono de 10 dígitos.');
  const codigoPostal = String(body.codigoPostal || '').trim();
  if (!/^\d{5}$/.test(codigoPostal)) throw new HttpError(400, 'Escribe un código postal de 5 dígitos.');

  return {
    name: textoRequerido(body.nombre, 60, 'Escribe el nombre del titular de la tarjeta.'),
    lastname: textoRequerido(body.apellidos, 60, 'Escribe los apellidos del titular de la tarjeta.'),
    email: validarCorreo(body.correo),
    phoneNumber: telefono,
    street: textoRequerido(body.calle, 80, 'Escribe la calle del titular de la tarjeta.'),
    externalNumber: textoRequerido(body.numeroExterior, 10, 'Escribe el número exterior del titular de la tarjeta.'),
    zipCode: codigoPostal,
  };
}

/** El monto siempre sale del saldo que devuelve el backend; el navegador solo elige entre las dos opciones. */
function montoAPagar(cuenta, opcion) {
  const monto = opcion === 'total' ? cuenta.total : cuenta.pagoRequerido;
  if (!(monto > 0)) throw new HttpError(422, 'Esta cuenta no tiene saldo por pagar.');
  return monto;
}

ruta('pagosYoLoPagoEstado', {
  methods: ['GET'],
  route: 'pagos/yolopago',
  handler: async () => json(200, { habilitado: habilitado() }),
});

ruta('pagosYoLoPagoIniciar', {
  methods: ['POST'],
  route: 'pagos/yolopago',
  handler: async ({ request, usuario }) => {
    const body = await leerJson(request);
    const idCuenta = validarEntero(body.idCuenta, 'Número de cuenta no válido.');
    const titular = validarTitular(body);
    const cuenta = await cuentaDelUsuario(usuario.idUsuarioApp, idCuenta);
    const monto = montoAPagar(cuenta, body.opcion);

    if (!habilitado() || !process.env.YOLOPAGO_URL || !process.env.YOLOPAGO_USUARIO || !process.env.YOLOPAGO_TOKEN) {
      throw new HttpError(503, 'El pago con tarjeta en línea estará disponible muy pronto. Mientras tanto puedes pagar desde la app ARM Móvil o en nuestras oficinas.');
    }

    const token = await llamarWcf('GenTok', { campoPass: 'c1', body: { p1: idCuenta } });
    const keyPago = String(token?.token || '').trim();
    const ordenCompra = String(token?.id_folio || '').trim();
    if (!keyPago || !ordenCompra) {
      throw new HttpError(502, 'No pudimos preparar tu pago. Intenta de nuevo en unos minutos.');
    }

    // El token de pago no llega al navegador: queda cifrado en una cookie, ligado a la cuenta y al monto,
    // para que la confirmación (pendiente) aplique exactamente este cargo.
    const pago = cifrar(JSON.stringify({ u: usuario.idUsuarioApp, c: idCuenta, m: formatoMonto(monto), t: keyPago, o: ordenCompra, exp: Date.now() + DURACION_PAGO_S * 1000 }));

    return json(
      200,
      {
        monto,
        ordenCompra,
        portal: {
          accion: process.env.YOLOPAGO_URL,
          campos: {
            j_username: process.env.YOLOPAGO_USUARIO,
            j_password: process.env.YOLOPAGO_TOKEN,
            amount: formatoMonto(monto),
            operation: 'COMPRA',
            // JSON.stringify escapa comillas y caracteres especiales (la app arma este JSON concatenando).
            params: JSON.stringify({ trxNbr: ordenCompra, ...titular }),
          },
        },
      },
      [cookie(COOKIE_PAGO, pago, DURACION_PAGO_S)],
    );
  },
});
