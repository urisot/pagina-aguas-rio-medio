import { getCollection } from 'astro:content';
import { site } from '../data/site.js';

const estaticas = [
  '/', '/tramites-y-servicios/', '/tarifas/', '/noticias/', '/sabias-que/', '/preguntas-frecuentes/',
  '/medidas-sanitarias/', '/contacto/', '/pago-en-linea/', '/politica-de-privacidad/', '/elimina-tu-cuenta/',
];

export async function GET() {
  const noticias = await getCollection('noticias');
  const sabias = await getCollection('sabias-que');
  const rutas = [
    ...estaticas,
    ...noticias.map((n) => `/noticias/${n.id}/`),
    ...sabias.map((s) => `/sabias-que/${s.id}/`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.map((r) => `  <url><loc>${site.url}${r}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
