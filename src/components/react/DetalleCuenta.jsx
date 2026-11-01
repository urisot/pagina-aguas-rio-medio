import { useEffect, useRef, useState } from 'react';
import Alert from './Alert.jsx';
import TablaConceptos from './TablaConceptos.jsx';
import GraficaConsumos from './GraficaConsumos.jsx';
import useSesion, { siSesionVencida } from './useSesion.js';
import estadoCuenta, { estaVencido } from './estadoCuenta.js';
import { obtenerCuenta, obtenerConceptos, obtenerHistorialRecibos, obtenerHistorialPagos } from '../../services/cuentasService.js';
import { formatoMxn } from '../../data/tarifas.js';

const PESTANAS = [
  { id: 'detalle', label: 'Detalle', icon: 'receipt_long' },
  { id: 'consumos', label: 'Historial de consumos', icon: 'bar_chart' },
  { id: 'pagos', label: 'Pagos', icon: 'payments' },
];

/** Carga una lista solo cuando la pestaña se abre por primera vez. */
function useCarga(activa, cargar) {
  const [estado, setEstado] = useState({ datos: null, error: '' });
  useEffect(() => {
    if (!activa || estado.datos) return undefined;
    let vigente = true;
    cargar()
      .then((datos) => vigente && setEstado({ datos, error: '' }))
      .catch((err) => vigente && !siSesionVencida(err) && setEstado({ datos: null, error: err.message }));
    return () => { vigente = false; };
  }, [activa, estado.datos]);
  return estado;
}

function Cargando({ texto }) {
  return <p role="status" className="py-6 text-center text-on-surface-variant">{texto}</p>;
}

function PestanaDetalle({ cuenta, recibo, onRecibo }) {
  const [conceptos, setConceptos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setConceptos(null);
    setError('');
    obtenerConceptos(cuenta.idCuenta, recibo)
      .then((lista) => vigente && setConceptos(lista))
      .catch((err) => vigente && !siSesionVencida(err) && setError(err.message));
    return () => { vigente = false; };
  }, [recibo]);

  return (
    <div className="space-y-6">
      <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <div><dt className="text-on-surface-variant">Titular</dt><dd className="font-bold">{cuenta.titular || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Domicilio</dt><dd className="font-bold">{cuenta.direccion || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Servicio y tarifa</dt><dd className="font-bold">{[cuenta.servicio, cuenta.tarifa].filter(Boolean).join(' · ') || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Medidor</dt><dd className="font-bold">{cuenta.idMedidor || '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Periodo</dt><dd className="font-bold">{cuenta.periodo || '—'}</dd></div>
        <div>
          <dt className="text-on-surface-variant">Fecha de vencimiento</dt>
          <dd className={`flex items-center gap-1 font-bold ${estaVencido(cuenta) ? 'text-error' : ''}`}>
            {estaVencido(cuenta) && <span className="icon !text-[1.8rem]" aria-hidden="true">error</span>}
            {cuenta.fechaVencimiento || '—'}
            {estaVencido(cuenta) && <span className="badge badge-error ml-1">Vencido</span>}
          </dd>
        </div>
        <div><dt className="text-on-surface-variant">Lecturas (anterior → actual)</dt><dd className="font-bold tabular-nums">{cuenta.lecturaAnterior || cuenta.lecturaActual ? `${cuenta.lecturaAnterior} → ${cuenta.lecturaActual}` : '—'}</dd></div>
        <div><dt className="text-on-surface-variant">Consumo del periodo</dt><dd className="font-bold">{cuenta.consumo} m³ <span className="font-normal text-on-surface-variant">(promedio {cuenta.promedio} m³)</span></dd></div>
        <div><dt className="text-on-surface-variant">Pago requerido</dt><dd className="font-display text-xl font-extrabold text-primary">{formatoMxn(cuenta.pagoRequerido)}</dd></div>
        <div><dt className="text-on-surface-variant">Saldo total</dt><dd className="font-display text-xl font-extrabold">{formatoMxn(cuenta.total)}</dd></div>
      </dl>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold">Conceptos del recibo {recibo}</h3>
          {recibo !== cuenta.idRecibo && (
            <button type="button" className="btn btn-ghost no-print !h-[4rem]" onClick={() => onRecibo(cuenta.idRecibo)}>Ver recibo vigente</button>
          )}
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {!error && conceptos === null && <Cargando texto="Cargando conceptos…" />}
        {conceptos && <TablaConceptos conceptos={conceptos} />}
      </div>
    </div>
  );
}

function PestanaConsumos({ estado, onRecibo }) {
  if (estado.error) return <Alert type="error">{estado.error}</Alert>;
  if (!estado.datos) return <Cargando texto="Cargando historial…" />;
  if (estado.datos.length === 0) return <p className="py-6 text-center text-on-surface-variant">Esta cuenta aún no tiene recibos emitidos.</p>;
  return (
    <div className="space-y-6">
      <GraficaConsumos recibos={estado.datos} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Historial de recibos y consumos</caption>
          <thead>
            <tr className="border-y border-primary-brand/10 bg-surface-container-low text-xs uppercase tracking-[0.06em] text-on-surface-variant">
              <th scope="col" className="px-3 py-2">Ciclo</th>
              <th scope="col" className="px-3 py-2">Periodo</th>
              <th scope="col" className="px-3 py-2 text-right">Consumo</th>
              <th scope="col" className="px-3 py-2 text-right">Total</th>
              <th scope="col" className="no-print px-3 py-2"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {estado.datos.map((r) => (
              <tr key={r.idRecibo} className="border-b border-primary-brand/5">
                <th scope="row" className="px-3 py-2 font-semibold">{r.ciclo || '—'}</th>
                <td className="px-3 py-2">{r.periodo || '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.consumo} m³</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">{formatoMxn(r.total)}</td>
                <td className="no-print px-3 py-2 text-right">
                  <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => onRecibo(r.idRecibo)}>Ver conceptos</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PestanaPagos({ estado }) {
  if (estado.error) return <Alert type="error">{estado.error}</Alert>;
  if (!estado.datos) return <Cargando texto="Cargando pagos…" />;
  if (estado.datos.length === 0) return <p className="py-6 text-center text-on-surface-variant">No hay pagos registrados para esta cuenta.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <caption className="sr-only">Historial de pagos</caption>
        <thead>
          <tr className="border-y border-primary-brand/10 bg-surface-container-low text-xs uppercase tracking-[0.06em] text-on-surface-variant">
            <th scope="col" className="px-3 py-2">Fecha</th>
            <th scope="col" className="px-3 py-2">Folio</th>
            <th scope="col" className="px-3 py-2">Forma de pago</th>
            <th scope="col" className="px-3 py-2">Estatus</th>
            <th scope="col" className="px-3 py-2 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {estado.datos.map((p) => (
            <tr key={p.id || p.folio} className="border-b border-primary-brand/5">
              <th scope="row" className="px-3 py-2 font-semibold">{p.fecha || '—'}</th>
              <td className="px-3 py-2">{p.folio || '—'}</td>
              <td className="px-3 py-2">{[p.formaPago, p.caja].filter(Boolean).join(' · ') || '—'}</td>
              <td className="px-3 py-2">{p.estatus || '—'}</td>
              <td className="px-3 py-2 text-right font-bold tabular-nums">{formatoMxn(p.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DetalleCuenta() {
  const { perfil, error: errorSesion } = useSesion();
  const [idCuenta] = useState(() => Number.parseInt(new URLSearchParams(window.location.search).get('id'), 10));
  const [cuenta, setCuenta] = useState(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('detalle');
  const [recibo, setRecibo] = useState('');
  const botones = useRef({});

  useEffect(() => {
    if (!perfil) return;
    if (!Number.isInteger(idCuenta)) {
      setError('Falta el número de cuenta. Regresa a tus recibos y elige una cuenta.');
      return;
    }
    obtenerCuenta(idCuenta)
      .then((datos) => { setCuenta(datos); setRecibo(datos.idRecibo); })
      .catch((err) => !siSesionVencida(err) && setError(err.message));
  }, [perfil]);

  const consumos = useCarga(Boolean(cuenta) && pestana === 'consumos', () => obtenerHistorialRecibos(idCuenta));
  const pagos = useCarga(Boolean(cuenta) && pestana === 'pagos', () => obtenerHistorialPagos(idCuenta));

  const verRecibo = (id) => {
    setRecibo(id);
    setPestana('detalle');
  };

  // Navegación con flechas entre pestañas (patrón WAI-ARIA tabs).
  const alTeclear = (event) => {
    const indice = PESTANAS.findIndex((p) => p.id === pestana);
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const siguiente = PESTANAS[(indice + delta + PESTANAS.length) % PESTANAS.length].id;
    setPestana(siguiente);
    botones.current[siguiente]?.focus();
  };

  const volver = <a href="/pago-en-linea/" className="btn btn-ghost no-print"><span className="icon !text-[2rem]" aria-hidden="true">arrow_back</span> Mis recibos</a>;

  if (errorSesion || error) {
    return <div className="space-y-4">{volver}<Alert type="error" title="No pudimos cargar la cuenta">{errorSesion || error}</Alert></div>;
  }
  if (!cuenta) return <Cargando texto="Cargando la cuenta…" />;

  const estado = estadoCuenta(cuenta);

  return (
    <div className="space-y-6">
      {volver}
      <section aria-labelledby="detalle-titulo" className="print-area card space-y-6 !p-6 sm:!p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" width="40" height="40" className="h-10 w-10" />
            <div>
              <h2 id="detalle-titulo" className="font-display text-2xl font-extrabold">Cuenta {cuenta.idCuenta}</h2>
              <p className="text-sm text-on-surface-variant">Consultado el {new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</p>
            </div>
          </div>
          <span className={`badge ${estado.clase}`}>{estado.texto}</span>
        </header>

        <div role="tablist" aria-label="Información de la cuenta" className="no-print flex gap-2 overflow-x-auto border-b border-primary-brand/10" onKeyDown={alTeclear}>
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              ref={(el) => { botones.current[p.id] = el; }}
              type="button"
              role="tab"
              id={`tab-${p.id}`}
              aria-selected={pestana === p.id}
              aria-controls={`panel-${p.id}`}
              tabIndex={pestana === p.id ? 0 : -1}
              onClick={() => setPestana(p.id)}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 font-display text-sm font-bold transition ${pestana === p.id ? 'border-primary-brand text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
            >
              <span className="icon !text-[2rem]" aria-hidden="true">{p.icon}</span>{p.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`tab-${pestana}`} tabIndex={0}>
          {pestana === 'detalle' && <PestanaDetalle cuenta={cuenta} recibo={recibo} onRecibo={setRecibo} />}
          {pestana === 'consumos' && <PestanaConsumos estado={consumos} onRecibo={verRecibo} />}
          {pestana === 'pagos' && <PestanaPagos estado={pagos} />}
        </div>

        <div className="no-print flex flex-wrap gap-3 border-t border-primary-brand/10 pt-5">
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <span className="icon !text-[2rem]" aria-hidden="true">print</span> Imprimir o guardar PDF
          </button>
        </div>
      </section>
    </div>
  );
}
