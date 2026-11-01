import { PASOS, ESTATUS, nombreEstatus } from '../../services/reportesService.js';

const ETIQUETAS_CORTAS = {
  [ESTATUS.ABIERTO]: 'Abierto',
  [ESTATUS.EN_SEGUIMIENTO]: 'Seguimiento',
  [ESTATUS.EN_SUPERVISION]: 'Supervisión',
  [ESTATUS.CERRADO]: 'Cerrado',
};

function resumen(paso) {
  const faltan = PASOS.length - 1 - paso;
  if (faltan === 0) return 'Reporte atendido y cerrado';
  return faltan === 1 ? 'Falta 1 etapa para el cierre' : `Faltan ${faltan} etapas para el cierre`;
}

/** Progreso compacto del reporte en las 4 etapas del flujo normal (como la línea de tiempo de la app). */
export default function AvanceReporte({ idEstatus }) {
  if (idEstatus === ESTATUS.CANCELADO) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-error-container p-3 text-sm font-semibold text-on-error-container">
        <span className="icon !text-[1.8rem]" aria-hidden="true">cancel</span> Reporte cancelado
      </p>
    );
  }

  // Estatus desconocido: se toma como recién abierto.
  const paso = Math.max(PASOS.indexOf(idEstatus), 0);
  const porcentaje = (paso / (PASOS.length - 1)) * 100;

  return (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={PASOS.length}
        aria-valuenow={paso + 1}
        aria-valuetext={`Etapa ${paso + 1} de ${PASOS.length}: ${nombreEstatus(idEstatus)}. ${resumen(paso)}.`}
        className="relative px-2 pt-1"
      >
        <span className="absolute left-4 right-4 top-[0.9rem] h-1 rounded-full bg-slate-200" aria-hidden="true" />
        <span className="absolute left-4 top-[0.9rem] h-1 rounded-full bg-primary-brand transition-all" style={{ width: `calc((100% - 3.2rem) * ${porcentaje / 100})` }} aria-hidden="true" />
        <ol className="relative flex justify-between" aria-hidden="true">
          {PASOS.map((id, i) => (
            <li key={id} className="flex w-16 flex-col items-center gap-1 first:items-start last:items-end">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${i <= paso ? 'border-primary-brand bg-primary-brand text-white' : 'border-slate-300 bg-white'} ${i === paso ? 'ring-4 ring-primary-brand/20' : ''}`}>
                {i < paso && <span className="icon !text-[1.2rem]">check</span>}
              </span>
              <span className={`whitespace-nowrap text-[1.1rem] ${i === paso ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>{ETIQUETAS_CORTAS[id]}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-xs font-semibold text-on-surface-variant">Etapa {paso + 1} de {PASOS.length} · {resumen(paso)}</p>
    </div>
  );
}
