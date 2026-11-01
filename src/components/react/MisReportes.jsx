import { useEffect, useState } from 'react';
import Alert from './Alert.jsx';
import AvanceReporte from './AvanceReporte.jsx';
import useSesion, { siSesionVencida } from './useSesion.js';
import { obtenerReportes, nombreEstatus, claseEstatus, esFinal } from '../../services/reportesService.js';

export default function MisReportes() {
  const { perfil, error: errorSesion } = useSesion();
  const [reportes, setReportes] = useState(null);
  const [error, setError] = useState('');
  const [verCerrados, setVerCerrados] = useState(false);

  const cargar = () => {
    setError('');
    obtenerReportes()
      .then(setReportes)
      .catch((err) => !siSesionVencida(err) && setError(err.message));
  };

  useEffect(() => {
    if (perfil) cargar();
  }, [perfil]);

  if (errorSesion) return <Alert type="error" title="No pudimos cargar tu información">{errorSesion}</Alert>;
  if (error) {
    return (
      <Alert type="error" title="No pudimos cargar tus reportes">
        {error} <button type="button" className="font-bold underline" onClick={cargar}>Reintentar</button>
      </Alert>
    );
  }
  if (!reportes) return <p role="status" className="text-center text-on-surface-variant">Cargando tus reportes…</p>;

  if (reportes.length === 0) {
    return (
      <div className="card text-center">
        <span className="icon icon-fill !text-[4.8rem] text-primary-brand/40" aria-hidden="true">assignment</span>
        <p className="mt-2 font-display text-xl font-bold">No tienes reportes</p>
        <p className="text-on-surface-variant">Puedes levantar un reporte de fuga o falta de agua desde la app ARM Móvil o por WhatsApp.</p>
      </div>
    );
  }

  const pendientes = reportes.filter((r) => !esFinal(r.idEstatus));
  const cerrados = reportes.filter((r) => esFinal(r.idEstatus));
  const visibles = verCerrados ? reportes : pendientes;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          {pendientes.length === 1 ? '1 reporte pendiente' : `${pendientes.length} reportes pendientes`}
          {cerrados.length > 0 && ` · ${cerrados.length} cerrados o cancelados`}
        </p>
        {cerrados.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setVerCerrados((v) => !v)} aria-pressed={verCerrados}>
            {verCerrados ? 'Ver solo pendientes' : 'Ver también cerrados'}
          </button>
        )}
      </div>

      {visibles.length === 0 ? (
        <Alert type="success">No tienes reportes pendientes. Todos tus reportes están cerrados.</Alert>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visibles.map((r) => (
            <li key={r.folio}>
              <a href={`/mis-reportes/detalle/?folio=${encodeURIComponent(r.folio)}`} className="card card-hover flex h-full flex-col gap-3 !p-5">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-lg font-bold">{r.tipo || 'Reporte'}</span>
                  <span className={`badge ${claseEstatus(r.idEstatus)}`}>{nombreEstatus(r.idEstatus, r.estatus)}</span>
                </span>
                <span className="text-sm text-on-surface-variant">Folio {r.folio}{r.fecha && ` · ${r.fecha}`}</span>
                {r.idCuenta > 0 && <span className="text-sm text-on-surface-variant">Cuenta {r.idCuenta}</span>}
                <div className="rounded-xl bg-surface-container-low p-3">
                  <AvanceReporte idEstatus={r.idEstatus} />
                </div>
                <span className="mt-auto flex items-center gap-1 pt-2 font-display text-sm font-bold text-primary">
                  Ver seguimiento <span className="icon !text-[1.8rem]" aria-hidden="true">arrow_forward</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
