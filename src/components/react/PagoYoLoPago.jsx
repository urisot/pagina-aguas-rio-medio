import { useEffect, useRef, useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import { siSesionVencida } from './useSesion.js';
import { obtenerEstadoPago, iniciarPagoYoLoPago } from '../../services/pagosService.js';
import { formatoMxn } from '../../data/tarifas.js';

const VENTANA_PORTAL = 'portal-yolopago';

const datosIniciales = (perfil) => ({
  nombre: perfil?.nombres || '',
  apellidos: perfil?.apellidos || '',
  correo: perfil?.correo || '',
  telefono: perfil?.celular || '',
  calle: '',
  numeroExterior: '',
  codigoPostal: '',
});

// Mismas reglas que valida el proxy (validarTitular en api/_rutas/pagos.js).
function validar(datos) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Escribe el nombre del titular de la tarjeta.';
  if (!datos.apellidos.trim()) errores.apellidos = 'Escribe los apellidos del titular de la tarjeta.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo.trim())) errores.correo = 'Escribe un correo electrónico válido.';
  if (datos.telefono.replace(/\D/g, '').length !== 10) errores.telefono = 'Escribe un teléfono de 10 dígitos.';
  if (!datos.calle.trim()) errores.calle = 'Escribe la calle.';
  if (!datos.numeroExterior.trim()) errores.numeroExterior = 'Escribe el número exterior.';
  if (!/^\d{5}$/.test(datos.codigoPostal.trim())) errores.codigoPostal = 'Escribe un código postal de 5 dígitos.';
  return errores;
}

/** Resultado que YoLoPago entrega a la app (YLPPaymentResult): { paymentinfo: { success, message, reference, ... } }. */
function leerResultado(data) {
  try {
    const resultado = typeof data === 'string' ? JSON.parse(data) : data;
    return resultado?.paymentinfo ? resultado.paymentinfo : null;
  } catch {
    return null;
  }
}

function OpcionMonto({ id, titulo, detalle, monto, checked, onChange }) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-4 transition ${checked ? 'border-primary-brand bg-surface-container-low' : 'border-slate-100'}`}>
      <span className="flex items-center gap-3">
        <input type="radio" id={id} name="opcion-monto" className="h-5 w-5 accent-primary-brand" checked={checked} onChange={onChange} />
        <span>
          <span className="block font-display font-bold">{titulo}</span>
          <span className="block text-xs text-on-surface-variant">{detalle}</span>
        </span>
      </span>
      <span className="font-display text-xl font-extrabold tabular-nums text-primary">{formatoMxn(monto)}</span>
    </label>
  );
}

/**
 * Ventana para pagar un recibo con tarjeta por YoLoPago (flujo de PagoTarjetaActivity en la app):
 * monto y datos del titular → portal de YoLoPago en un iframe → resultado.
 * La tarjeta se captura solo en el portal de YoLoPago; este sitio nunca la ve.
 */
export default function PagoYoLoPago({ cuenta, perfil, onCerrar }) {
  const [habilitado, setHabilitado] = useState(null);
  const [paso, setPaso] = useState('datos');
  const [opcion, setOpcion] = useState(cuenta.pagoRequerido > 0 ? 'requerido' : 'total');
  const [datos, setDatos] = useState(() => datosIniciales(perfil));
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pago, setPago] = useState(null);
  const [resultado, setResultado] = useState(null);
  const cerrarRef = useRef(null);
  const formPortal = useRef(null);

  const monto = opcion === 'total' ? cuenta.total : cuenta.pagoRequerido;
  const mostrarOpciones = cuenta.pagoRequerido > 0 && cuenta.total > cuenta.pagoRequerido;

  useEffect(() => {
    obtenerEstadoPago()
      .then(setHabilitado)
      .catch((err) => {
        if (!siSesionVencida(err)) setHabilitado(false);
      });
  }, []);

  useEffect(() => {
    cerrarRef.current?.focus();
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, []);

  // Con el portal abierto (3DSecure, banco) el pago puede estar en curso: Escape no cierra la ventana.
  useEffect(() => {
    if (paso === 'portal') return undefined;
    const onKey = (event) => event.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [paso, onCerrar]);

  // Abre el portal: POST del formulario oculto hacia el iframe, como wvBrowser.postUrl en la app.
  useEffect(() => {
    if (paso === 'portal' && pago) formPortal.current?.submit();
  }, [paso, pago]);

  // Pendiente de confirmar con YoLoPago cómo entrega el resultado en web. Solo se aceptan mensajes de su dominio.
  useEffect(() => {
    if (paso !== 'portal' || !pago) return undefined;
    const origen = new URL(pago.portal.accion).origin;
    const onMensaje = (event) => {
      if (event.origin !== origen) return;
      const info = leerResultado(event.data);
      if (!info) return;
      setResultado(info);
      setPaso('resultado');
    };
    window.addEventListener('message', onMensaje);
    return () => window.removeEventListener('message', onMensaje);
  }, [paso, pago]);

  const cambiar = (campo) => (event) => setDatos((previo) => ({ ...previo, [campo]: event.target.value }));

  const continuar = async (event) => {
    event.preventDefault();
    const nuevos = validar(datos);
    setErrores(nuevos);
    setError('');
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const respuesta = await iniciarPagoYoLoPago({ idCuenta: cuenta.idCuenta, opcion, ...datos });
      setPago(respuesta);
      setPaso('portal');
    } catch (err) {
      if (!siSesionVencida(err)) setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 backdrop-blur-[12px]" style={{ background: 'rgb(29 53 87 / 0.4)' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="pago-titulo" className="flex max-h-[92vh] w-full max-w-2xl animate-rise flex-col overflow-hidden rounded-3xl bg-white shadow-modal">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Pago con tarjeta · YoLoPago</p>
            <h2 id="pago-titulo" className="font-display text-2xl font-extrabold">Pagar cuenta {cuenta.idCuenta}</h2>
          </div>
          {paso !== 'portal' && (
            <button type="button" ref={cerrarRef} className="btn btn-ghost !h-[4rem] !px-3" onClick={onCerrar} aria-label="Cerrar ventana de pago">
              <span className="icon" aria-hidden="true">close</span>
            </button>
          )}
        </header>

        <div className="overflow-y-auto p-6 sm:px-8">
          {paso === 'datos' && (
            <form id="form-pago" onSubmit={continuar} noValidate className="space-y-6">
              <section aria-labelledby="pago-resumen" className="space-y-3">
                <h3 id="pago-resumen" className="font-display text-lg font-bold">Resumen del recibo</h3>
                <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-surface-container-low p-4 text-sm">
                  <div><dt className="text-on-surface-variant">Titular</dt><dd className="font-bold">{cuenta.titular || '—'}</dd></div>
                  <div><dt className="text-on-surface-variant">Folio</dt><dd className="font-bold">{cuenta.idRecibo || '—'}</dd></div>
                  <div><dt className="text-on-surface-variant">Periodo</dt><dd className="font-bold">{cuenta.periodo || '—'}</dd></div>
                  <div><dt className="text-on-surface-variant">Vencimiento</dt><dd className="font-bold">{cuenta.fechaVencimiento || '—'}</dd></div>
                </dl>
              </section>

              <fieldset className="space-y-3">
                <legend className="mb-3 font-display text-lg font-bold">¿Cuánto quieres pagar?</legend>
                {mostrarOpciones ? (
                  <>
                    <OpcionMonto id="monto-requerido" titulo="Pago requerido" detalle="Lo mínimo para mantener tu cuenta al corriente" monto={cuenta.pagoRequerido} checked={opcion === 'requerido'} onChange={() => setOpcion('requerido')} />
                    <OpcionMonto id="monto-total" titulo="Saldo total" detalle="Liquida todo el adeudo de la cuenta" monto={cuenta.total} checked={opcion === 'total'} onChange={() => setOpcion('total')} />
                  </>
                ) : (
                  <p className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4">
                    <span className="font-display font-bold">{opcion === 'total' ? 'Saldo total' : 'Pago requerido'}</span>
                    <span className="font-display text-2xl font-extrabold tabular-nums text-primary">{formatoMxn(monto)}</span>
                  </p>
                )}
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="mb-1 font-display text-lg font-bold">Datos del titular de la tarjeta</legend>
                <p className="text-sm text-on-surface-variant">YoLoPago los pide para validar el cargo con tu banco. Los datos de tu tarjeta los escribirás en el portal seguro de YoLoPago.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="pago-nombre" label="Nombre(s)" autoComplete="cc-given-name" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} maxLength={60} required />
                  <Field id="pago-apellidos" label="Apellidos" autoComplete="cc-family-name" value={datos.apellidos} onChange={cambiar('apellidos')} error={errores.apellidos} maxLength={60} required />
                  <Field id="pago-correo" label="Correo electrónico" type="email" autoComplete="email" value={datos.correo} onChange={cambiar('correo')} error={errores.correo} hint="Aquí te llegará el comprobante de YoLoPago." maxLength={100} required />
                  <Field id="pago-telefono" label="Teléfono" type="tel" inputMode="numeric" autoComplete="tel-national" value={datos.telefono} onChange={cambiar('telefono')} error={errores.telefono} maxLength={14} required />
                  <Field id="pago-calle" label="Calle" autoComplete="address-line1" value={datos.calle} onChange={cambiar('calle')} error={errores.calle} maxLength={80} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Field id="pago-numero" label="Núm. exterior" autoComplete="off" value={datos.numeroExterior} onChange={cambiar('numeroExterior')} error={errores.numeroExterior} maxLength={10} required />
                    <Field id="pago-cp" label="Código postal" inputMode="numeric" autoComplete="postal-code" value={datos.codigoPostal} onChange={cambiar('codigoPostal')} error={errores.codigoPostal} maxLength={5} required />
                  </div>
                </div>
              </fieldset>

              {habilitado === false && (
                <Alert type="warning" title="Pago en línea próximamente">
                  Estamos terminando de habilitar el pago con tarjeta en el sitio. Mientras tanto puedes pagar desde la app ARM Móvil o en nuestras oficinas.
                </Alert>
              )}
              {error && <Alert type="error" title="No pudimos preparar tu pago">{error}</Alert>}
            </form>
          )}

          {paso === 'portal' && pago && (
            <div className="space-y-4">
              <Alert type="info">No cierres ni recargues esta página mientras completas el pago en YoLoPago. Puede pedirte una confirmación de tu banco.</Alert>
              <p className="flex justify-between text-sm"><span className="text-on-surface-variant">Orden de compra: <span className="font-bold text-on-surface">{pago.ordenCompra}</span></span><span className="font-bold tabular-nums">{formatoMxn(pago.monto)}</span></p>
              <form ref={formPortal} method="post" action={pago.portal.accion} target={VENTANA_PORTAL} className="hidden">
                {Object.entries(pago.portal.campos).map(([nombre, valor]) => (
                  <input key={nombre} type="hidden" name={nombre} value={valor} />
                ))}
              </form>
              <iframe name={VENTANA_PORTAL} title="Portal de pago seguro de YoLoPago" className="h-[60vh] min-h-[48rem] w-full rounded-2xl border border-slate-100" />
              <button type="button" className="btn btn-ghost w-full" onClick={onCerrar}>Salir del pago</button>
              <p className="text-center text-xs text-on-surface-variant">Si ya autorizaste el cargo con tu banco, no salgas: espera a que YoLoPago muestre el resultado.</p>
            </div>
          )}

          {paso === 'resultado' && resultado && (
            <div className="space-y-4 text-center">
              <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${resultado.success ? 'bg-[#eaf7e8] text-[#1b5e20]' : 'bg-error-container text-error'}`}>
                <span className="icon icon-fill !text-[3.2rem]" aria-hidden="true">{resultado.success ? 'check_circle' : 'error'}</span>
              </span>
              <h3 className="font-display text-2xl font-extrabold">{resultado.success ? 'Tu banco autorizó el cargo' : 'El pago no se realizó'}</h3>
              {resultado.success ? (
                <Alert type="warning" title="Pago en validación">
                  Estamos registrando tu pago; lo verás reflejado en tu saldo en cuanto se confirme. Guarda tu código de autorización: {resultado.codeAuthorizer || '—'} (referencia {resultado.reference || '—'}).
                </Alert>
              ) : (
                <Alert type="error">{resultado.message || 'Tu banco rechazó el cargo. Revisa los datos de tu tarjeta o intenta con otra.'}</Alert>
              )}
            </div>
          )}
        </div>

        {paso !== 'portal' && (
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-end sm:px-8">
            <button type="button" className="btn btn-ghost" onClick={onCerrar} disabled={enviando}>{paso === 'resultado' ? 'Cerrar' : 'Cancelar'}</button>
            {paso === 'datos' && (
              <button type="submit" form="form-pago" className="btn btn-primary" disabled={enviando || !habilitado}>
                <span className="icon !text-[2rem]" aria-hidden="true">{enviando ? 'hourglass_top' : 'lock'}</span>
                {enviando ? 'Preparando pago…' : `Continuar al pago de ${formatoMxn(monto)}`}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
