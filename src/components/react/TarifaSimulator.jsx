import { useMemo, useState } from 'react';
import { tarifas, totalTarifa, formatoMxn } from '../../data/tarifas.js';

const fraccionamientos = ['Lomas de Río Medio 4', 'Bosques de Río Medio'];

export default function TarifaSimulator() {
  const [codigo, setCodigo] = useState('D-2');
  const [fraccionamiento, setFraccionamiento] = useState(fraccionamientos[0]);
  const [inapam, setInapam] = useState(false);

  const tarifa = tarifas.find((t) => t.codigo === codigo);
  const esDomestica = tarifa.grupo === 'domestico';
  const aplicaDescuento = inapam && esDomestica;

  const { regular, total } = useMemo(() => {
    const base = totalTarifa(tarifa);
    return { regular: base, total: aplicaDescuento ? Math.round(base * 50) / 100 : base };
  }, [tarifa, aplicaDescuento]);

  const desglose = [
    ['Agua potable', tarifa.agua],
    ['Drenaje y alcantarillado', tarifa.drenaje],
    ['Saneamiento (tratamiento)', tarifa.saneamiento],
    ['IVA trasladado (16%)', tarifa.iva],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2" id="simulador">
      <form className="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
        <div>
          <label htmlFor="sim-tipo" className="field-label">Tipo de inmueble</label>
          <select id="sim-tipo" className="field" value={codigo} onChange={(e) => setCodigo(e.target.value)}>
            {tarifas.map((t) => (
              <option key={t.codigo} value={t.codigo}>{t.nombre} ({t.codigo})</option>
            ))}
          </select>
          <p className="mt-2 text-sm text-on-surface-variant">{tarifa.descripcion}</p>
        </div>
        <div>
          <label htmlFor="sim-frac" className="field-label">Fraccionamiento</label>
          <select id="sim-frac" className="field" value={fraccionamiento} onChange={(e) => setFraccionamiento(e.target.value)}>
            {fraccionamientos.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-container-low p-4">
          <input
            type="checkbox"
            checked={inapam}
            onChange={(e) => setInapam(e.target.checked)}
            className="mt-1 h-5 w-5 flex-shrink-0 accent-[#0a6cb5]"
          />
          <span className="text-sm font-semibold">
            Acredito derecho al subsidio INAPAM / pensión (50% de descuento)
            {inapam && !esDomestica && (
              <span className="mt-1 block font-normal text-warn">El descuento aplica solo a uso doméstico.</span>
            )}
          </span>
        </label>
      </form>

      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-brand p-8 text-white shadow-modal" aria-live="polite">
        <p className="font-display text-xs font-bold uppercase tracking-[0.08em] text-on-primary-container">Monto mensual proyectado</p>
        <p className="mt-2 font-display text-5xl font-extrabold tabular-nums">
          {formatoMxn(total)} <span className="text-lg font-semibold text-on-primary-container">MXN</span>
        </p>
        {aplicaDescuento && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
            <span className="icon !text-[1.6rem]" aria-hidden="true">check</span>
            Bonificación del 50% aplicada (tarifa regular {formatoMxn(regular)})
          </p>
        )}
        <dl className="mt-6 space-y-2 border-t border-white/20 pt-4 text-sm">
          {desglose.map(([nombre, valor]) => (
            <div key={nombre} className="flex justify-between gap-4">
              <dt className="text-on-primary-container">{nombre}</dt>
              <dd className="font-semibold tabular-nums">{formatoMxn(aplicaDescuento ? valor / 2 : valor)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-on-primary-container">
          Estimación para {fraccionamiento}. El importe final lo calcula Aguas de Río Medio con base en tu recibo.
        </p>
        <a href="/pago-en-linea/" className="btn btn-light mt-6 w-full">
          <span className="icon" aria-hidden="true">payments</span> Consultar mi recibo
        </a>
      </div>
    </div>
  );
}
