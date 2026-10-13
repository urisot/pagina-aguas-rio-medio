import { useEffect, useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { consultarCuenta, obtenerHistorialRecibos, obtenerDetalleRecibo } from '../../services/paymentService.js';
import { leerCuentas, guardarCuentas, MAX_CUENTAS } from '../../services/accountsStorage.js';
import { formatoMxn } from '../../data/tarifas.js';

function estadoCuenta(c) {
  if (c.total <= 0) return { texto: 'Al corriente', clase: 'badge-ok' };
  if (c.mesesRezago > 0) return { texto: `${c.mesesRezago} mes(es) de rezago`, clase: 'badge-warn' };
  return { texto: 'Saldo pendiente', clase: 'badge-info' };
}

const esFilaTotal = (c) => c.concepto.trim().toLowerCase() === 'total';

function TablaConceptos({ conceptos: todos }) {
  // El backend incluye una fila "Total" que ya suma el recibo: se muestra como pie y no como concepto.
  const conceptos = todos.filter((c) => !esFilaTotal(c));
  const filaTotal = todos.find(esFilaTotal);
  if (conceptos.length === 0) {
    return <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Este recibo no tiene conceptos registrados.</p>;
  }
  const total = filaTotal ? filaTotal.total : conceptos.reduce((suma, c) => suma + c.total, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <caption className="sr-only">Conceptos del recibo</caption>
        <thead>
          <tr className="border-y border-primary-brand/10 bg-surface-container-low text-xs uppercase tracking-[0.06em] text-on-surface-variant">
            <th scope="col" className="px-3 py-2">Concepto</th>
            <th scope="col" className="px-3 py-2 text-right">Subtotal</th>
            <th scope="col" className="px-3 py-2 text-right">IVA</th>
            <th scope="col" className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {conceptos.map((c) => (
            <tr key={c.id} className="border-b border-primary-brand/5">
              <th scope="row" className="px-3 py-2 font-semibold">
                {c.concepto}
                {c.esRezago && <span className="badge badge-warn ml-2">Rezago</span>}
              </th>
              <td className="px-3 py-2 text-right tabular-nums">{formatoMxn(c.subtotal)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatoMxn(c.iva)}</td>
              <td className="px-3 py-2 text-right font-bold tabular-nums">{formatoMxn(c.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3} className="px-3 py-3 text-right font-display">Total del recibo</th>
            <td className="px-3 py-3 text-right font-display text-xl font-extrabold text-primary tabular-nums">{formatoMxn(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function DetalleCuenta({ cuenta, onCerrar }) {
  const [reciboId, setReciboId] = useState(cuenta.idRecibo);
  const [conceptos, setConceptos] = useState([]);
  const [historial, setHistorial] = useState(new Map());
  const [verTodos, setVerTodos] = useState(false);
  const pendientes = cuenta.recibosPendientes || [];
  const visibles = verTodos ? pendientes : pendientes.slice(0, 6);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerHistorialRecibos(cuenta.idCuenta)
      .then((lista) => activo && setHistorial(new Map(lista.map((r) => [r.idRecibo, r]))))
      .catch(() => {});
    return () => { activo = false; };
  }, [cuenta.idCuenta]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    obtenerDetalleRecibo(reciboId)
      .then((lista) => activo && setConceptos(lista))
      .catch((err) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [reciboId]);

  const estado = estadoCuenta(cuenta);

  return (
    <section aria-labelledby="detalle-titulo" className="print-area card space-y-6 !p-6 sm:!p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" width="40" height="40" className="h-10 w-10" />
          <div>
            <h2 id="detalle-titulo" className="font-display text-2xl font-extrabold">Detalle de la cuenta {cuenta.idCuenta}</h2>
            <p className="text-sm text-on-surface-variant">Consultado el {new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>
        </div>
        <span className={`badge ${estado.clase}`}>{estado.texto}</span>
      </header>

      <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <div><dt className="text-on-surface-variant">Titular</dt><dd className="font-bold">{cuenta.titular || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Domicilio</dt><dd className="font-bold">{cuenta.direccion || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Servicio y tarifa</dt><dd className="font-bold">{[cuenta.servicio, cuenta.tarifa].filter(Boolean).join(' · ') || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Periodo</dt><dd className="font-bold">{cuenta.periodo || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Fecha de vencimiento</dt><dd className="font-bold">{cuenta.fechaVencimiento || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Consumo</dt><dd className="font-bold">{cuenta.consumo} m³</dd></div>
        <div><dt className="text-on-surface-variant">Saldo actual</dt><dd className="font-display text-xl font-extrabold text-primary">{formatoMxn(cuenta.total)}</dd></div>
      </dl>

      <div>
        <h3 className="mb-3 font-display text-lg font-bold">Conceptos del recibo</h3>
        {cargando && <p className="text-sm text-on-surface-variant" role="status">Cargando detalle…</p>}
        {error && <Alert type="error" title="No pudimos cargar el detalle">{error}</Alert>}
        {!cargando && !error && <TablaConceptos conceptos={conceptos} />}
      </div>

      {pendientes.length > 0 && (
        <div className="no-print">
          <h3 className="mb-3 font-display text-lg font-bold">
            Recibos pendientes <span className="text-on-surface-variant">({pendientes.length})</span>
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {visibles.map((r) => {
              const hist = historial.get(r.idRecibo);
              return (
                <li key={r.idRecibo} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${r.idRecibo === reciboId ? 'border-primary-brand bg-surface-container-low' : 'border-primary-brand/10'}`}>
                  <div>
                    <p className="font-display font-bold">{hist?.ciclo || `Recibo ${r.idRecibo}`}</p>
                    <p className="text-sm text-on-surface-variant">{hist ? `${hist.consumo} m³ · ${formatoMxn(hist.total)}` : r.idRecibo}</p>
                  </div>
                  <button type="button" className="btn btn-ghost !h-[4rem]" onClick={() => setReciboId(r.idRecibo)} aria-pressed={r.idRecibo === reciboId}>
                    {r.idRecibo === reciboId ? 'Viendo' : 'Ver detalle'}
                  </button>
                </li>
              );
            })}
          </ul>
          {pendientes.length > 6 && (
            <button type="button" className="btn btn-ghost mt-4" onClick={() => setVerTodos((v) => !v)} aria-expanded={verTodos}>
              {verTodos ? 'Mostrar menos' : `Mostrar los ${pendientes.length} recibos`}
            </button>
          )}
        </div>
      )}

      <div className="no-print flex flex-wrap gap-3 border-t border-primary-brand/10 pt-5">
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          <span className="icon !text-[2rem]" aria-hidden="true">print</span> Imprimir o guardar PDF
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCerrar}>Cerrar detalle</button>
      </div>
    </section>
  );
}

export default function AccountsPortal() {
  const [numeros, setNumeros] = useState([]);
  const [cuentas, setCuentas] = useState({}); // idCuenta -> { datos } | { error }
  const [listo, setListo] = useState(false);
  const [numero, setNumero] = useState('');
  const [errorCampo, setErrorCampo] = useState('');
  const [error, setError] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [seleccion, setSeleccion] = useState(null);
  const [porQuitar, setPorQuitar] = useState(null);

  const cargar = async (lista) => {
    const resultados = await Promise.allSettled(lista.map((n) => consultarCuenta(n)));
    const mapa = {};
    resultados.forEach((r, i) => {
      mapa[lista[i]] = r.status === 'fulfilled' ? { datos: r.value } : { error: r.reason.message };
    });
    setCuentas((previo) => ({ ...previo, ...mapa }));
  };

  const agregarNumero = async (valor, actuales) => {
    setError('');
    if (!/^\d+$/.test(valor)) {
      setErrorCampo('Escribe solo números, sin espacios ni guiones.');
      return;
    }
    setErrorCampo('');
    const id = Number.parseInt(valor, 10);
    if (actuales.includes(id)) {
      setErrorCampo('Esta cuenta ya está en tu lista.');
      return;
    }
    if (actuales.length >= MAX_CUENTAS) {
      setError(`Puedes guardar hasta ${MAX_CUENTAS} cuentas. Quita una para agregar otra.`);
      return;
    }
    setAgregando(true);
    try {
      const datos = await consultarCuenta(id);
      const lista = [...actuales, datos.idCuenta];
      setNumeros(lista);
      guardarCuentas(lista);
      setCuentas((previo) => ({ ...previo, [datos.idCuenta]: { datos } }));
      setNumero('');
      setSeleccion(datos.idCuenta);
    } catch (err) {
      setError(err.message);
    } finally {
      setAgregando(false);
    }
  };

  useEffect(() => {
    const guardadas = leerCuentas();
    setNumeros(guardadas);
    cargar(guardadas).finally(() => {
      setListo(true);
      // Viene de la consulta rápida del inicio: /pago-en-linea/?cuenta=123
      const desdeInicio = new URLSearchParams(window.location.search).get('cuenta');
      if (desdeInicio) {
        setNumero(desdeInicio);
        const existente = Number.parseInt(desdeInicio, 10);
        if (guardadas.includes(existente)) setSeleccion(existente);
        else agregarNumero(desdeInicio.trim(), guardadas);
      }
    });
  }, []);

  const agregar = (event) => {
    event.preventDefault();
    agregarNumero(numero.trim(), numeros);
  };

  const actualizar = async (id) => {
    setCuentas((previo) => ({ ...previo, [id]: { cargando: true, datos: previo[id]?.datos } }));
    await cargar([id]);
  };

  const quitar = () => {
    const lista = numeros.filter((n) => n !== porQuitar);
    setNumeros(lista);
    guardarCuentas(lista);
    if (seleccion === porQuitar) setSeleccion(null);
    setPorQuitar(null);
  };

  const totalGeneral = numeros.reduce((suma, n) => suma + (cuentas[n]?.datos?.total || 0), 0);
  const seleccionada = seleccion && cuentas[seleccion]?.datos;

  return (
    <div className="space-y-8">
      {numeros.length > 0 && (
        <div className="no-print grid gap-4 sm:grid-cols-3">
          <div className="card !p-5">
            <p className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Total a pagar<span className="icon text-primary-brand" aria-hidden="true">payments</span></p>
            <p className="mt-2 font-display text-3xl font-extrabold text-primary tabular-nums">{formatoMxn(totalGeneral)}</p>
            <p className="text-xs text-on-surface-variant">MXN · suma de tus cuentas</p>
          </div>
          <div className="card !p-5">
            <p className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Cuentas registradas<span className="icon text-primary-brand" aria-hidden="true">water_drop</span></p>
            <p className="mt-2 font-display text-3xl font-extrabold">{numeros.length} <span className="text-sm font-semibold text-on-surface-variant">inmuebles</span></p>
            <p className="text-xs text-on-surface-variant">Guardadas en este dispositivo</p>
          </div>
          <div className="card !p-5">
            <p className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">Recibos pendientes<span className="icon text-warn" aria-hidden="true">receipt_long</span></p>
            <p className="mt-2 font-display text-3xl font-extrabold text-warn">{numeros.reduce((s, n) => s + (cuentas[n]?.datos?.recibosPendientes?.length || 0), 0)}</p>
            <p className="text-xs text-on-surface-variant">Entre todas tus cuentas</p>
          </div>
        </div>
      )}
      <form onSubmit={agregar} noValidate className="no-print card space-y-4 !p-6 sm:!p-8">
        <h2 className="font-display text-xl font-bold">Agregar una cuenta</h2>
        <Field
          id="cuenta"
          label="Número de cuenta o contrato"
          inputMode="numeric"
          placeholder="Ej. 104829"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          error={errorCampo}
          hint="Lo encuentras en la parte superior derecha de tu recibo. Se guarda solo en este dispositivo."
          autoComplete="off"
          required
        />
        {error && <Alert type="error" title="No pudimos agregar la cuenta">{error}</Alert>}
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={agregando}>
          <span className="icon !text-[2rem]" aria-hidden="true">{agregando ? 'hourglass_top' : 'add_circle'}</span>
          {agregando ? 'Consultando…' : 'Agregar y consultar saldo'}
        </button>
      </form>

      {!listo && <p role="status" className="text-center text-on-surface-variant">Cargando tus cuentas…</p>}

      {listo && numeros.length === 0 && (
        <div className="no-print card text-center">
          <span className="icon icon-fill !text-[4.8rem] text-primary-brand/40" aria-hidden="true">account_balance_wallet</span>
          <p className="mt-2 font-display text-xl font-bold">Aún no tienes cuentas</p>
          <p className="text-on-surface-variant">Agrega tu número de cuenta para ver tu saldo y el detalle de tu recibo.</p>
        </div>
      )}

      {numeros.length > 0 && (
        <section aria-labelledby="cuentas-titulo" className="no-print space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="cuentas-titulo" className="font-display text-2xl font-bold">Mis cuentas</h2>
            {numeros.length > 1 && (
              <p className="text-sm font-semibold text-on-surface-variant">
                Saldo total: <span className="font-display text-lg font-extrabold text-primary tabular-nums">{formatoMxn(totalGeneral)}</span>
              </p>
            )}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {numeros.map((n) => {
              const item = cuentas[n];
              const c = item?.datos;
              const estado = c && estadoCuenta(c);
              return (
                <li key={n} className={`card flex flex-col gap-4 !p-5 ${seleccion === n ? '!border-primary-brand ring-4 ring-primary-brand/10' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary-brand"><span className="icon" aria-hidden="true">home</span></span>
                    <div className="min-w-0 flex-grow">
                      <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold">
                        Cuenta {n}
                        {estado && <span className={`badge ${estado.clase}`}>{estado.texto}</span>}
                      </p>
                      <p className="truncate text-sm text-on-surface-variant">Titular: {c?.titular || (item?.error ? 'No disponible' : 'Consultando…')}</p>
                    </div>
                  </div>
                  {c && (
                    <>
                      <p className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
                        <span className="icon !text-[1.8rem]" aria-hidden="true">location_on</span>{c.direccion || '—'}
                      </p>
                      <dl className="grid grid-cols-2 gap-3 px-1 text-xs">
                        <div><dt className="text-on-surface-variant">Tipo de tarifa</dt><dd className="font-bold">{c.tarifa || '—'}</dd></div>
                        <div><dt className="text-on-surface-variant">Vencimiento del recibo</dt><dd className={`font-bold ${c.total > 0 ? 'text-error' : ''}`}>{c.fechaVencimiento || '—'}</dd></div>
                      </dl>
                      <div className="rounded-xl bg-surface-container-low p-4">
                        <p className="text-xs font-semibold text-on-surface-variant">Folio: {c.idRecibo || '—'}</p>
                        <p className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-display text-4xl font-extrabold text-primary tabular-nums">{formatoMxn(c.total)} <span className="text-xs font-bold text-on-surface-variant">MXN</span></span>
                          <span className="text-xs text-on-surface-variant">Periodo: {c.periodo}</span>
                        </p>
                      </div>
                    </>
                  )}
                  {item?.error && <Alert type="error">{item.error}</Alert>}
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {c && (
                      <button type="button" className="btn btn-primary !h-[4rem]" onClick={() => setSeleccion(n)} aria-pressed={seleccion === n}>
                        Ver detalle del recibo
                      </button>
                    )}
                    <button type="button" className="btn btn-ghost !h-[4rem]" onClick={() => actualizar(n)} aria-label={`Actualizar saldo de la cuenta ${n}`}>
                      <span className="icon !text-[2rem]" aria-hidden="true">refresh</span>
                    </button>
                    <button type="button" className="btn btn-ghost !h-[4rem]" onClick={() => setPorQuitar(n)} aria-label={`Quitar la cuenta ${n}`}>
                      <span className="icon !text-[2rem]" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {seleccionada && <DetalleCuenta key={seleccionada.idCuenta} cuenta={seleccionada} onCerrar={() => setSeleccion(null)} />}

      <ConfirmDialog
        open={porQuitar !== null}
        title="¿Quitar esta cuenta?"
        confirmLabel="Quitar cuenta"
        onConfirm={quitar}
        onCancel={() => setPorQuitar(null)}
      >
        La cuenta {porQuitar} dejará de aparecer en este dispositivo. Podrás agregarla de nuevo cuando quieras.
      </ConfirmDialog>
    </div>
  );
}
