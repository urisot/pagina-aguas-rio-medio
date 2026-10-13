// Fuente temporal de tarifas (ciclo 2026) tomada de las plantillas de diseño. Reemplazar por el origen oficial.
export const tarifas = [
  { codigo: 'D-1', grupo: 'domestico', icon: 'home', nombre: 'Doméstico Popular', descripcion: 'Predios unifamiliares con construcción menor o igual a 60 m².', agua: 112.5, drenaje: 39.38, saneamiento: 22.5, iva: 10.12 },
  { codigo: 'D-2', grupo: 'domestico', icon: 'cottage', nombre: 'Doméstico Medio', descripcion: 'Viviendas de 61 m² hasta 140 m² de construcción continua.', agua: 163.9, drenaje: 57.37, saneamiento: 32.78, iva: 14.75 },
  { codigo: 'D-3', grupo: 'domestico', icon: 'domain', nombre: 'Residencial', descripcion: 'Viviendas mayores a 140 m² o con amenidades y jardines amplios.', agua: 239.08, drenaje: 83.68, saneamiento: 47.82, iva: 21.52 },
  { codigo: 'C-1', grupo: 'comercial', icon: 'storefront', nombre: 'Comercial / Negocios', descripcion: 'Locales comerciales, oficinas, talleres y servicios mercantiles.', agua: 345, drenaje: 120.75, saneamiento: 69, iva: 50.25 },
];

export const totalTarifa = (t) => Math.round((t.agua + t.drenaje + t.saneamiento + t.iva) * 100) / 100;

export const formatoMxn = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
