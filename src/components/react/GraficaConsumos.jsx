// Gráfica de barras en SVG nativo (sin librerías). Recibe los recibos del más reciente al más antiguo.
const ALTO = 180;
const MARGEN_INF = 28;
const ANCHO_BARRA = 28;
const SEPARACION = 14;

export default function GraficaConsumos({ recibos }) {
  const datos = recibos.slice(0, 12).reverse();
  if (datos.length === 0) return null;

  const maximo = Math.max(...datos.map((r) => r.consumo), 1);
  const promedio = datos.reduce((suma, r) => suma + r.consumo, 0) / datos.length;
  const ancho = datos.length * (ANCHO_BARRA + SEPARACION) + SEPARACION;
  const escala = (valor) => (valor / maximo) * (ALTO - MARGEN_INF - 20);
  const yPromedio = ALTO - MARGEN_INF - escala(promedio);

  return (
    <figure className="space-y-2">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${ancho} ${ALTO}`}
          width={ancho}
          height={ALTO}
          role="img"
          aria-label={`Consumo de los últimos ${datos.length} recibos. Promedio ${Math.round(promedio)} metros cúbicos.`}
          className="max-w-none"
        >
          <line x1="0" x2={ancho} y1={ALTO - MARGEN_INF} y2={ALTO - MARGEN_INF} className="stroke-slate-200" />
          {datos.map((r, i) => {
            const alto = escala(r.consumo);
            const x = SEPARACION + i * (ANCHO_BARRA + SEPARACION);
            const y = ALTO - MARGEN_INF - alto;
            return (
              <g key={r.idRecibo || i}>
                <title>{`${r.ciclo || r.periodo}: ${r.consumo} m³`}</title>
                <rect x={x} y={y} width={ANCHO_BARRA} height={Math.max(alto, 1)} rx="6" className={i === datos.length - 1 ? 'fill-primary-brand' : 'fill-primary-brand/35'} />
                <text x={x + ANCHO_BARRA / 2} y={y - 6} textAnchor="middle" className="fill-on-surface text-[11px] font-bold">{r.consumo}</text>
                <text x={x + ANCHO_BARRA / 2} y={ALTO - 10} textAnchor="middle" className="fill-on-surface-variant text-[10px]">{(r.ciclo || '').slice(-5)}</text>
              </g>
            );
          })}
          <line x1="0" x2={ancho} y1={yPromedio} y2={yPromedio} strokeDasharray="4 4" className="stroke-secondary" />
        </svg>
      </div>
      <figcaption className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-primary-brand" aria-hidden="true" />Recibo más reciente</span>
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dashed border-secondary" aria-hidden="true" />Promedio: {Math.round(promedio)} m³</span>
      </figcaption>
    </figure>
  );
}
