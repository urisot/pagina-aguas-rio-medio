import { useState } from 'react';
import { tarifas, totalTarifa, formatoMxn } from '../../data/tarifas.js';

const filtros = [
  { id: 'todos', label: 'Todos los precios' },
  { id: 'domestico', label: 'Domésticos' },
  { id: 'comercial', label: 'Comercial y otros' },
];

export default function TarifaCards() {
  const [filtro, setFiltro] = useState('todos');
  const visibles = tarifas.filter((t) => filtro === 'todos' || t.grupo === filtro);

  return (
    <div className="space-y-8">
      <div role="group" aria-label="Filtrar tarifas" className="inline-flex flex-wrap rounded-xl bg-surface-container p-1">
        {filtros.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`rounded-lg px-4 py-2 font-display text-sm font-semibold transition ${filtro === f.id ? 'bg-white text-primary shadow-card' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visibles.map((t) => {
          const total = totalTarifa(t);
          const [entero, decimal] = total.toFixed(2).split('.');
          return (
            <li key={t.codigo} className="card flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-md bg-surface-container px-2 py-1 font-display text-[1.1rem] font-bold uppercase tracking-[0.06em] text-primary">Código {t.codigo}</span>
                <span className="icon text-primary-brand" aria-hidden="true">{t.icon}</span>
              </div>
              <h3 className="font-display text-xl font-bold">{t.nombre}</h3>
              <p className="mt-1 min-h-[4.8rem] text-sm text-on-surface-variant">{t.descripcion}</p>
              <div className="my-4 rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-on-surface-variant">{t.grupo === 'comercial' ? 'Cuota mensual base estimada' : 'Cuota mensual total estimada'}</p>
                <p className="font-display text-4xl font-extrabold text-primary tabular-nums">
                  ${Number(entero).toLocaleString('es-MX')}<span className="text-lg">.{decimal}</span>
                  <span className="ml-1 text-xs font-bold text-on-surface-variant">MXN</span>
                </p>
              </div>
              <dl className="space-y-1.5 text-sm">
                {[['Agua potable', t.agua], ['Drenaje y alcantarillado', t.drenaje], ['Saneamiento (tratamiento)', t.saneamiento], ['IVA trasladado (16%)', t.iva]].map(([n, v]) => (
                  <div key={n} className="flex justify-between gap-2"><dt className="text-on-surface-variant">{n}</dt><dd className="font-semibold tabular-nums">{formatoMxn(v)}</dd></div>
                ))}
              </dl>
              <p className="mt-4 rounded-lg bg-[#eaf7e8] p-3 text-xs font-semibold text-[#1b5e20]">
                {t.grupo === 'domestico'
                  ? `Tarifa social INAPAM / jubilados: ${formatoMxn(total / 2)} MXN`
                  : 'Consumo excedente: medición volumétrica por m³ según rango mensual.'}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
