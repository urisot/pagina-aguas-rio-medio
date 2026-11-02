# Aguas de Río Medio — sitio web

Sitio web de **Aguas de Río Medio**, organismo operador de agua potable, alcantarillado y saneamiento en Lomas de Río Medio 4 y Bosques de Río Medio. Reemplaza el sitio anterior en WordPress e incluye un portal para que los usuarios consulten sus recibos y reportes.

- **Producción:** https://pagina-aguas-rio-medio.vercel.app
- **Stack:** Astro 5, islas de React 19, Tailwind CSS 4, JavaScript
- **Hosting:** Vercel (deploy automático desde `main`); alternativa en Azure Static Web Apps

## Funcionalidades

**Parte pública**

- Inicio con avisos, accesos rápidos y últimas noticias.
- Trámites y servicios, tarifas con simulador de consumo y preguntas frecuentes con buscador.
- Noticias con paginación y sección "¿Sabías que?".
- Medidas sanitarias, contacto, política de privacidad y eliminación de cuenta (`/elimina-tu-cuenta/`, la usa la app en Google Play).
- SEO: título y descripción por página, Open Graph, `sitemap.xml` y `robots.txt`.

**Portal de usuario**

- Inicio de sesión, registro con código por correo y restablecimiento de contraseña.
- Mis recibos (`/pago-en-linea/`): cuentas vinculadas, vincular y desvincular cuentas.
- Detalle de cuenta: historial de recibos, conceptos de cada recibo y historial de pagos.
- Mis reportes con detalle y línea de tiempo del estatus.
- Mi perfil y cambio de contraseña.
- Pago con YoLoPago: construido pero deshabilitado hasta que la pasarela defina la confirmación del pago en web.

## Arquitectura

```
Navegador ──► Sitio estático (Astro)
          └─► /api/* ──► Proxy (api/, función de Vercel) ──► Backend WCF (ComapaVic_OS.svc)
```

El navegador nunca llama al backend. El proxy guarda la llave del servicio, mantiene la sesión en una cookie firmada (`HttpOnly`) y revisa que cada cuenta, recibo o reporte consultado pertenezca al usuario.

## Estructura

```
├── api/                 Proxy hacia el WCF
│   ├── _rutas/          Una ruta por dominio (auth, registro, cuentas, reportes, perfil, pagos)
│   ├── _lib/            Sesión, llamadas al WCF, normalización de respuestas
│   ├── portal.js        Entrada para Vercel
│   └── _azure.js        Entrada para Azure Functions
├── design/              Plantillas HTML del diseño
├── public/              Imágenes, logos, robots.txt
├── src/
│   ├── components/      Componentes .astro y react/ (islas interactivas)
│   ├── content/         Noticias y "¿Sabías que?" (Content Collections)
│   ├── data/            Datos del sitio, tarifas y preguntas frecuentes
│   ├── layouts/         BaseLayout (header, footer, SEO, analítica)
│   ├── pages/           Rutas del sitio y del portal
│   ├── services/        Acceso al proxy desde el navegador
│   └── styles/          Estilos globales
└── vercel.json          Rewrites del proxy, redirecciones y headers de seguridad
```

## Requisitos

- Node.js 20 o superior.
- Para correr el portal en local: [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) instalado globalmente.

## Desarrollo

```bash
git clone https://github.com/urisot/pagina-aguas-rio-medio.git
cd pagina-aguas-rio-medio
npm install
cd api && npm install && cd ..

npm run dev          # solo el sitio, en http://localhost:4321
npm run dev:portal   # sitio + proxy, en http://localhost:4280
npm run build        # genera dist/
```

### Variables de entorno del proxy

En local van en `api/local.settings.json` (copia de `api/local.settings.json.template`, ignorado por git). En Vercel, en *Project > Settings > Environment Variables*.

| Variable | Uso |
|----------|-----|
| `WCF_BASE_URL` | URL del servicio, incluye `/ComapaVic_OS.svc` |
| `WCF_PASS` | Llave del servicio WCF |
| `SESSION_SECRET` | Secreto para firmar las cookies (32 caracteres o más) |
| `YOLOPAGO_HABILITADO`, `YOLOPAGO_URL`, `YOLOPAGO_USUARIO`, `YOLOPAGO_TOKEN` | Pago con YoLoPago (deshabilitado) |

Las variables con prefijo `PUBLIC_` (`.env`, ver `.env.template`) llegan al navegador: nunca pongas secretos en ellas.

## Proyectos relacionados

| Proyecto | Descripción |
|----------|-------------|
| [ARMMOVIL2](https://github.com/urisot/ARMMOVIL2) | App Android ARM Móvil; mismos flujos que el portal |
| [WCF-ARM-Pagos-Android](https://github.com/jsgarcial83/WCF-ARM-Pagos-Android) | Backend WCF (VB.NET) que consume el proxy |

## Seguridad

- No subas `.env`, `api/local.settings.json` ni llaves al repositorio.
- Los datos de tarjeta nunca pasan por este código: el cobro lo hace la pasarela.
- El monto a pagar lo calcula y valida el servidor.
