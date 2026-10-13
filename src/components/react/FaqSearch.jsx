import { useMemo, useState } from 'react';
import { faqs, categorias } from '../../data/faqs.js';

const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function FaqSearch() {
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [abiertas, setAbiertas] = useState(() => new Set());

  const resultados = useMemo(() => {
    const termino = normalizar(query.trim());
    return faqs.filter((faq) => {
      const coincideCategoria = categoria === 'todas' || faq.cat === categoria;
      const coincideTexto = !termino || normalizar(`${faq.q} ${faq.a}`).includes(termino);
      return coincideCategoria && coincideTexto;
    });
  }, [query, categoria]);

  const alternar = (id) =>
    setAbiertas((previo) => {
      const siguiente = new Set(previo);
      siguiente.has(id) ? siguiente.delete(id) : siguiente.add(id);
      return siguiente;
    });

  const grupos = categorias
    .map((cat) => ({ ...cat, items: resultados.filter((faq) => faq.cat === cat.id) }))
    .filter((grupo) => grupo.items.length > 0);

  const conteo = (id) => faqs.filter((f) => f.cat === id).length;
  const filtros = [{ id: 'todas', label: 'Todas las preguntas', icon: 'tune' }, ...categorias];

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <form role="search" onSubmit={(event) => event.preventDefault()} className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-primary-brand/15 bg-white p-2 pl-5 shadow-card-hover">
          <span className="icon text-outline" aria-hidden="true">search</span>
          <label htmlFor="faq-buscar" className="sr-only">Buscar en preguntas frecuentes</label>
          <input
            id="faq-buscar"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por palabra clave (ej. descuento INAPAM, contrato SAS, fugas, OXXO…)"
            className="h-[4.4rem] min-w-0 flex-grow bg-transparent text-base outline-none placeholder:text-slate-500"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary !h-[4.4rem] !rounded-full">Buscar</button>
        </form>

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar por tema">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCategoria(f.id)}
              aria-pressed={categoria === f.id}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-display text-xs font-semibold transition ${
                categoria === f.id ? 'border-primary bg-primary text-white' : 'border-primary-brand/15 bg-white text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="icon !text-[1.6rem]" aria-hidden="true">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-on-surface-variant" aria-live="polite">
          Mostrando {resultados.length} {resultados.length === 1 ? 'pregunta encontrada' : 'preguntas encontradas'}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[28rem_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start" aria-label="Temas y datos bancarios">
          <div className="card !p-5">
            <p className="eyebrow !text-on-surface-variant">Guía directa</p>
            <h2 className="font-display text-lg font-bold">Explora por temas</h2>
            <ul className="mt-3 space-y-1">
              {categorias.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setCategoria(cat.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-surface-container ${categoria === cat.id ? 'bg-surface-container text-primary' : ''}`}
                  >
                    <span className="icon !text-[1.8rem] text-primary-brand" aria-hidden="true">{cat.icon}</span>
                    <span className="flex-grow">{cat.label}</span>
                    <span className="rounded-full bg-surface-container px-2 text-xs">{conteo(cat.id)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-surface-container-low p-4 text-xs">
              <p className="mb-2 flex items-center gap-1 font-display font-bold"><span className="icon !text-[1.6rem] text-primary-brand" aria-hidden="true">account_balance</span>Datos bancarios Santander</p>
              <p className="text-on-surface-variant">Válido solo para pagos fuera de la zona metropolitana.</p>
              <dl className="mt-2 space-y-1 rounded-lg bg-white p-2">
                <div className="flex justify-between gap-2"><dt className="text-on-surface-variant">Cuenta</dt><dd className="font-bold tabular-nums">6550301760-9</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-on-surface-variant">CLABE</dt><dd className="font-bold tabular-nums">014849655030176098</dd></div>
                <div><dt className="text-on-surface-variant">Beneficiario</dt><dd className="font-bold">INMOPUENTES S.A. DE C.V.</dd></div>
              </dl>
              <p className="mt-2 text-on-surface-variant">Envía tu comprobante con el número de cuenta a aguasderiomedio@gmail.com</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-ghost !h-[4rem] !px-2 !text-xs" onClick={() => setAbiertas(new Set(resultados.map((f) => f.id)))}>Expandir todas</button>
              <button type="button" className="btn btn-ghost !h-[4rem] !px-2 !text-xs" onClick={() => setAbiertas(new Set())}>Colapsar todas</button>
            </div>
          </div>
        </aside>

        <div className="space-y-10">
          {grupos.length === 0 ? (
            <div className="card text-center">
              <span className="icon icon-fill !text-[4.8rem] text-primary-brand/40" aria-hidden="true">search_off</span>
              <p className="mt-2 font-display text-xl font-bold">No encontramos resultados</p>
              <p className="mt-1 text-on-surface-variant">Prueba con otra palabra o escríbenos por WhatsApp.</p>
            </div>
          ) : (
            grupos.map((grupo) => (
              <section key={grupo.id} aria-labelledby={`grupo-${grupo.id}`}>
                <h2 id={`grupo-${grupo.id}`} className="mb-4 flex items-center gap-3 font-display text-2xl font-bold">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-brand text-white"><span className="icon !text-[2rem]" aria-hidden="true">{grupo.icon}</span></span>
                  {grupo.label}
                </h2>
                <ul className="space-y-3">
                  {grupo.items.map((faq) => {
                    const abierta = abiertas.has(faq.id);
                    return (
                      <li key={faq.id} className="overflow-hidden rounded-xl border border-primary-brand/10 bg-white shadow-card">
                        <h3>
                          <button
                            type="button"
                            onClick={() => alternar(faq.id)}
                            aria-expanded={abierta}
                            aria-controls={`faq-${faq.id}`}
                            className="flex w-full items-center justify-between gap-4 p-4 text-left font-display text-sm font-semibold hover:bg-surface-container-low"
                          >
                            {faq.q}
                            <span className={`icon text-primary-brand transition-transform duration-200 ${abierta ? 'rotate-180' : ''}`} aria-hidden="true">expand_more</span>
                          </button>
                        </h3>
                        <div id={`faq-${faq.id}`} hidden={!abierta} className="border-t border-primary-brand/10 bg-surface-container-low/60 p-4 text-sm text-on-surface-variant">
                          {faq.a}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
