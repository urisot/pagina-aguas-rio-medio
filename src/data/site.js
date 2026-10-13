export const site = {
  name: 'Aguas de Río Medio',
  legalName: 'INMOPUENTES S.A. DE C.V.',
  url: 'https://www.aguasderiomedio.com',
  description:
    'Organismo operador de agua potable, alcantarillado y saneamiento en Lomas de Río Medio 4 y Bosques de Río Medio, Veracruz. Consulta y paga tu recibo en línea.',
  phone: '+52 229 453 5838',
  phoneHref: 'tel:+522294535838',
  // TODO: confirmar el teléfono de emergencias; mientras tanto se usa el mismo número.
  emergencyPhone: '+52 229 453 5838',
  emergencyHref: 'tel:+522294535838',
  whatsappHref: 'https://wa.me/522294535838',
  email: 'aguasderiomedio@gmail.com',
  address: 'Río San Isidro No. 6 esq. Río Medellín, Fracc. Bosques de Río Medio, Veracruz',
  schedule: 'Lunes a viernes de 9:00 a 17:00 h',
  analyticsId: import.meta.env.PUBLIC_GA_ID || '',
};

export const nav = [
  { label: 'Inicio', href: '/' },
  { label: 'Tarifas', href: '/tarifas/' },
  { label: 'Trámites y servicios', href: '/tramites-y-servicios/' },
  { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes/' },
  { label: 'Sala de prensa', href: '/noticias/' },
  { label: 'Contacto', href: '/contacto/' },
];

export const footerLinks = [
  { label: 'Pagar en línea', href: '/pago-en-linea/' },
  { label: 'Medidas sanitarias', href: '/medidas-sanitarias/' },
  { label: '¿Sabías que?', href: '/sabias-que/' },
  { label: 'Política de privacidad', href: '/politica-de-privacidad/' },
  { label: 'Elimina tu cuenta', href: '/elimina-tu-cuenta/' },
];

export const tramites = [
  { icon: 'payments', title: 'Paga en línea', text: 'Consulta tu adeudo con tu número de cuenta y revisa tu recibo desde el celular.', href: '/pago-en-linea/', cta: 'Ir a pagos' },
  { icon: 'assignment', title: '¿Cómo contrato?', text: 'Documentos para contratar agua potable, drenaje y saneamiento o cambiar de titular.', href: '/tramites-y-servicios/#contratacion', cta: 'Ver requisitos' },
  { icon: 'plumbing', title: 'Reporta una fuga', text: 'Fugas en vía pública, baja presión o desazolve. Atendemos en máximo 24 horas.', href: '/contacto/', cta: 'Levantar reporte' },
  { icon: 'storefront', title: '¿Dónde pagar tu recibo?', text: 'Oficinas, tiendas OXXO, portal web y transferencia bancaria.', href: '/tramites-y-servicios/#donde-pagar', cta: 'Ver canales' },
  { icon: 'volunteer_activism', title: 'Descuento INAPAM', text: '50% de bonificación para jubilados, pensionados y adultos mayores.', href: '/tarifas/#inapam', cta: 'Conocer requisitos' },
  { icon: 'health_and_safety', title: 'Medidas sanitarias', text: 'Protocolos de purificación y monitoreo de la calidad del agua.', href: '/medidas-sanitarias/', cta: 'Conoce los estándares' },
];

// Avisos destacados (cortes, mantenimientos). Mientras se define el origen, viven aquí.
export const avisos = [
  {
    tipo: 'mantenimiento',
    titulo: 'Mantenimiento preventivo programado en la red de bombeo',
    detalle: 'Podría haber baja presión temporal en Lomas de Río Medio 4 durante los trabajos. Síguenos por WhatsApp para conocer horarios.',
  },
];
