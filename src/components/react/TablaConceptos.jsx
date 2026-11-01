import { formatoMxn } from '../../data/tarifas.js';

const esFilaTotal = (c) => c.concepto.trim().toLowerCase() === 'total';

export default function TablaConceptos({ conceptos: todos }) {
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
