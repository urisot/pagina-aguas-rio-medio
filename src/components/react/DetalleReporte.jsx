import { useEffect, useState } from 'react';
import Alert from './Alert.jsx';
import useSesion, { siSesionVencida } from './useSesion.js';
import { obtenerReporte, nombreEstatus, claseEstatus, PASOS, ESTATUS } from '../../services/reportesService.js';

// Si el servidor no tiene historial (LisHisRpt), la línea de tiempo se arma con los pasos del flujo normal.
function pasosLineaTiempo(reporte) {
  if (reporte.historial.length > 0) return reporte.historial.map((p) => ({ ...p, hecho: true }));
  if (reporte.idEstatus === ESTATUS.CANCELADO) {
    return [{ idEstatus: ESTATUS.CANCELADO, estatus: reporte.estatus, fecha: '', comentario: '', hecho: true }];
  }
  const actual = PASOS.indexOf(reporte.idEstatus);
  return PASOS.map((id, i) => ({ idEstatus: id, estatus: '', fecha: i === 0 ? reporte.fecha : '', comentario: '', hecho: i <= actual }));
}

export default function DetalleReporte() {
  const { perfil, error: errorSesion } = useSesion();
  const [folio] = useState(() => new URLSearchParams(window.location.search).get('folio') || '');
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!perfil) return;
    if (!folio) {
      setError('Falta el folio del reporte. Regresa a tus reportes y elige uno.');
      return;
    }
    obtenerReporte(folio)
      .then(setReporte)
      .catch((err) => !siSesionVencida(err) && setError(err.message));
  }, [perfil]);

  const volver = <a href="/mis-reportes/" className="btn btn-ghost"><span className="icon !text-[2rem]" aria-hidden="true">arrow_back</span> Mis reportes</a>;

  if (errorSesion || error) {
    return <div className="space-y-4">{volver}<Alert type="error" title="No pudimos cargar el reporte">{errorSesion || error}</Alert></div>;
  }
  if (!reporte) return <p role="status" className="text-center text-on-surface-variant">Cargando el reporte…</p>;

  const pasos = pasosLineaTiempo(reporte);
  const tieneMapa = reporte.latitud !== 0 && reporte.longitud !== 0;

  return (
    <div className="space-y-6">
      {volver}
      <article aria-labelledby="reporte-titulo" className="card space-y-6 !p-6 sm:!p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="reporte-titulo" className="font-display text-2xl font-extrabold">{reporte.tipo || 'Reporte'}</h2>
            <p className="text-sm text-on-surface-variant">Folio {reporte.folio}{reporte.fecha && ` · ${reporte.fecha}`}</p>
          </div>
          <span className={`badge ${claseEstatus(reporte.idEstatus)}`}>{nombreEstatus(reporte.idEstatus, reporte.estatus)}</span>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-on-surface-variant">Descripción</dt><dd className="whitespace-pre-line font-semibold">{reporte.descripcion || '—'}</dd></div>
            <div><dt className="text-on-surface-variant">Ubicación</dt><dd className="font-semibold">{reporte.direccion || '—'}</dd></div>
            {reporte.idCuenta > 0 && <div><dt className="text-on-surface-variant">Cuenta</dt><dd className="font-semibold">{reporte.idCuenta}</dd></div>}
            {tieneMapa && (
              <div>
                <a href={`https://www.google.com/maps?q=${reporte.latitud},${reporte.longitud}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
                  <span className="icon !text-[1.8rem]" aria-hidden="true">map</span> Ver en el mapa
                </a>
              </div>
            )}
          </dl>
          {reporte.foto && (
            <img src={reporte.foto.startsWith('data:') ? reporte.foto : `data:image/jpeg;base64,${reporte.foto}`} alt={`Foto del reporte ${reporte.folio}`} className="max-h-[36rem] w-full rounded-2xl object-cover" />
          )}
        </div>

        <section aria-labelledby="seguimiento-titulo">
          <h3 id="seguimiento-titulo" className="mb-4 font-display text-lg font-bold">Seguimiento</h3>
          <ol className="space-y-0">
            {pasos.map((p, i) => (
              <li key={`${p.idEstatus}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                {i < pasos.length - 1 && <span className={`absolute left-[1.1rem] top-10 h-[calc(100%-2.5rem)] w-0.5 ${p.hecho ? 'bg-primary-brand' : 'bg-slate-200'}`} aria-hidden="true" />}
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${p.hecho ? 'bg-primary-brand text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  <span className="icon !text-[1.8rem]" aria-hidden="true">{p.hecho ? 'check' : 'more_horiz'}</span>
                </span>
                <div>
                  <p className={`font-display font-bold ${p.hecho ? '' : 'text-on-surface-variant'}`}>
                    {nombreEstatus(p.idEstatus, p.estatus)}
                    <span className="sr-only">{p.hecho ? ' (completado)' : ' (pendiente)'}</span>
                  </p>
                  {p.fecha && <p className="text-sm text-on-surface-variant">{p.fecha}</p>}
                  {p.comentario && <p className="mt-1 text-sm">{p.comentario}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
