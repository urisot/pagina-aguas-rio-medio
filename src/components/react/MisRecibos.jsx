import { useEffect, useRef, useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import useSesion, { siSesionVencida } from './useSesion.js';
import { obtenerCuentas, vincularCuenta, desvincularCuenta } from '../../services/cuentasService.js';
import { formatoMxn } from '../../data/tarifas.js';
import estadoCuenta, { estaVencido } from './estadoCuenta.js';
import PagoYoLoPago from './PagoYoLoPago.jsx';

function FormVincular({ onVinculada, onCancelar, mostrarCancelar }) {
  const [cuenta, setCuenta] = useState('');
  const [titular, setTitular] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const primerCampo = useRef(null);

  useEffect(() => {
    if (mostrarCancelar) primerCampo.current?.focus();
  }, [mostrarCancelar]);

  const enviar = async (event) => {
    event.preventDefault();
    const nuevos = {};
    if (!/^\d+$/.test(cuenta.trim())) nuevos.cuenta = 'Escribe solo números, sin espacios ni guiones.';
    if (!titular.trim()) nuevos.titular = 'Escribe el nombre del titular como aparece en tu recibo.';
    setErrores(nuevos);
    setError('');
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const lista = await vincularCuenta(cuenta, titular.trim());
      onVinculada(lista, Number.parseInt(cuenta, 10));
    } catch (err) {
      if (!siSesionVencida(err)) setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="no-print card space-y-4 !p-6 sm:!p-8" aria-labelledby="vincular-titulo">
      <h2 id="vincular-titulo" className="font-display text-xl font-bold">Vincular un recibo</h2>
      <p className="text-sm text-on-surface-variant">Para proteger tus datos, pedimos el número de cuenta y el nombre del titular tal como aparecen en tu recibo.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cuenta" label="Número de cuenta" inputMode="numeric" autoComplete="off" placeholder="Ej. 104829" value={cuenta} onChange={(e) => setCuenta(e.target.value)} error={errores.cuenta} hint="Parte superior derecha de tu recibo." ref={primerCampo} required />
        <Field id="titular" label="Nombre del titular" autoComplete="off" value={titular} onChange={(e) => setTitular(e.target.value)} error={errores.titular} required />
      </div>
      {error && <Alert type="error" title="No pudimos vincular el recibo">{error}</Alert>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          <span className="icon !text-[2rem]" aria-hidden="true">{enviando ? 'hourglass_top' : 'add_link'}</span>
          {enviando ? 'Validando…' : 'Vincular recibo'}
        </button>
        {mostrarCancelar && <button type="button" className="btn btn-ghost" onClick={onCancelar} disabled={enviando}>Cancelar</button>}
      </div>
    </form>
  );
}

export default function MisRecibos() {
  const { perfil, error: errorSesion } = useSesion();
  const [cuentas, setCuentas] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [vinculando, setVinculando] = useState(false);
  const [porQuitar, setPorQuitar] = useState(null);
  const [quitando, setQuitando] = useState(false);
  const [porPagar, setPorPagar] = useState(null);

  const cargar = () => {
    setError('');
    obtenerCuentas()
      .then(setCuentas)
      .catch((err) => !siSesionVencida(err) && setError(err.message));
  };

  useEffect(() => {
    if (perfil) cargar();
  }, [perfil]);

  const alVincular = (lista, idCuenta) => {
    setCuentas(lista);
    setVinculando(false);
    setAviso(`La cuenta ${idCuenta} quedó vinculada a tu perfil.`);
  };

  const quitar = async () => {
    setQuitando(true);
    try {
      await desvincularCuenta(porQuitar);
      setCuentas((previo) => previo.filter((c) => c.idCuenta !== porQuitar));
      setAviso(`La cuenta ${porQuitar} ya no está vinculada a tu perfil.`);
    } catch (err) {
      if (!siSesionVencida(err)) setError(err.message);
    } finally {
      setQuitando(false);
      setPorQuitar(null);
    }
  };

  if (errorSesion) return <Alert type="error" title="No pudimos cargar tu información">{errorSesion}</Alert>;
  if (!perfil || (cuentas === null && !error)) return <p role="status" className="text-center text-on-surface-variant">Cargando tus recibos…</p>;

  const lista = cuentas || [];
  const totalGeneral = lista.reduce((suma, c) => suma + c.total, 0);
  const requeridoGeneral = lista.reduce((suma, c) => suma + c.pagoRequerido, 0);
  const vencidas = lista.filter(estaVencido).length;

  return (
    <div className="space-y-8">
      {aviso && <Alert type="success">{aviso}</Alert>}
      {error && (
        <Alert type="error" title="No pudimos cargar tus recibos">
          {error} <button type="button" className="font-bold underline" onClick={cargar}>Reintentar</button>
        </Alert>
      )}

      {lista.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card !p-5">
            <p className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Pago requerido<span className="icon text-primary-brand" aria-hidden="true">payments</span></p>
            <p className="mt-2 font-display text-3xl font-extrabold text-primary tabular-nums">{formatoMxn(requeridoGeneral)}</p>
            <p className="text-xs text-on-surface-variant">Saldo total de tus cuentas: {formatoMxn(totalGeneral)}</p>
          </div>
          <div className="card !p-5">
            <p className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Cuentas vinculadas<span className="icon text-primary-brand" aria-hidden="true">water_drop</span></p>
            <p className="mt-2 font-display text-3xl font-extrabold">{lista.length} <span className="text-sm font-semibold text-on-surface-variant">inmuebles</span></p>
            <p className="text-xs text-on-surface-variant">Disponibles también en la app</p>
          </div>
          <div className="card !p-5">
            <p className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Recibos vencidos<span className="icon text-error" aria-hidden="true">event_busy</span></p>
            <p className={`mt-2 font-display text-3xl font-extrabold ${vencidas > 0 ? 'text-error' : ''}`}>{vencidas}</p>
            <p className="text-xs text-on-surface-variant">Paga a tiempo para evitar recargos</p>
          </div>
        </div>
      )}

      {lista.length === 0 && !error && (
        <div className="card text-center">
          <span className="icon icon-fill !text-[4.8rem] text-primary-brand/40" aria-hidden="true">account_balance_wallet</span>
          <p className="mt-2 font-display text-xl font-bold">Aún no tienes recibos vinculados</p>
          <p className="text-on-surface-variant">Vincula tu primer recibo para ver tu saldo, el detalle de los conceptos y tu historial de consumo.</p>
        </div>
      )}

      {(vinculando || lista.length === 0) && !error ? (
        <FormVincular onVinculada={alVincular} onCancelar={() => setVinculando(false)} mostrarCancelar={lista.length > 0} />
      ) : null}

      {lista.length > 0 && (
        <section aria-labelledby="cuentas-titulo" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="cuentas-titulo" className="font-display text-2xl font-bold">Mis recibos</h2>
            {!vinculando && (
              <button type="button" className="btn btn-primary" onClick={() => { setVinculando(true); setAviso(''); }}>
                <span className="icon !text-[2rem]" aria-hidden="true">add_link</span> Vincular otro recibo
              </button>
            )}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {lista.map((c) => {
              const estado = estadoCuenta(c);
              const vencido = estaVencido(c);
              return (
                <li key={c.idCuenta} className="card flex flex-col gap-4 !p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary-brand"><span className="icon" aria-hidden="true">home</span></span>
                    <div className="min-w-0 flex-grow">
                      <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold">
                        Cuenta {c.idCuenta}
                        <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                      </p>
                      <p className="truncate text-sm text-on-surface-variant">Titular: {c.titular || '—'}</p>
                    </div>
                  </div>
                  <p className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
                    <span className="icon !text-[1.8rem]" aria-hidden="true">location_on</span>{c.direccion || '—'}
                  </p>
                  <dl className="grid grid-cols-2 gap-3 px-1 text-xs">
                    <div><dt className="text-on-surface-variant">Tipo de tarifa</dt><dd className="font-bold">{c.tarifa || '—'}</dd></div>
                    <div>
                      <dt className="text-on-surface-variant">Vencimiento del recibo</dt>
                      <dd className={`flex items-center gap-1 font-bold ${vencido ? 'text-error' : ''}`}>
                        {vencido && <span className="icon !text-[1.6rem]" aria-hidden="true">error</span>}
                        {c.fechaVencimiento || '—'}
                        {vencido && <span className="sr-only">(vencido)</span>}
                      </dd>
                    </div>
                  </dl>
                  <div className="rounded-xl bg-surface-container-low p-4">
                    <p className="flex flex-wrap justify-between gap-2 text-xs font-semibold text-on-surface-variant"><span>Folio: {c.idRecibo || '—'}</span><span>Periodo: {c.periodo || '—'}</span></p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Pago requerido</p>
                    <p className="font-display text-4xl font-extrabold text-primary tabular-nums">{formatoMxn(c.pagoRequerido)} <span className="text-xs font-bold text-on-surface-variant">MXN</span></p>
                    <p className="mt-1 text-sm text-on-surface-variant">Saldo total: <span className="font-bold tabular-nums text-on-surface">{formatoMxn(c.total)}</span></p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {c.total > 0 && (
                      <button type="button" className="btn btn-primary !h-[4rem]" onClick={() => { setPorPagar(c); setAviso(''); }} aria-label={`Pagar la cuenta ${c.idCuenta}`}>
                        <span className="icon !text-[2rem]" aria-hidden="true">credit_card</span> Pagar
                      </button>
                    )}
                    <a href={`/pago-en-linea/cuenta/?id=${c.idCuenta}`} className={`btn ${c.total > 0 ? 'btn-ghost' : 'btn-primary'} !h-[4rem]`}>Ver detalle</a>
                    <button type="button" className="btn btn-ghost !h-[4rem]" onClick={() => setPorQuitar(c.idCuenta)} aria-label={`Quitar la cuenta ${c.idCuenta}`}>
                      <span className="icon !text-[2rem]" aria-hidden="true">link_off</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={porQuitar !== null}
        title="¿Quitar este recibo?"
        confirmLabel="Quitar recibo"
        danger
        loading={quitando}
        onConfirm={quitar}
        onCancel={() => setPorQuitar(null)}
      >
        La cuenta {porQuitar} dejará de aparecer en tu perfil, también en la app. Podrás vincularla de nuevo cuando quieras.
      </ConfirmDialog>

      {porPagar && (
        <PagoYoLoPago
          cuenta={porPagar}
          perfil={perfil}
          onCerrar={() => { setPorPagar(null); cargar(); }}
        />
      )}
    </div>
  );
}
