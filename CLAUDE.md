Proyecto:

Rediseño del sitio web de Aguas de Río Medio (https://www.aguasderiomedio.com/), organismo operador de los servicios de agua potable, alcantarillado y saneamiento en los fraccionamientos Lomas de Río Medio 4 y Bosques de Río Medio.

El sitio actual está hecho en WordPress 7 (PHP 8.2, Nginx) con un tema hijo `bootstrap-basic4-child`, Bootstrap 4, jQuery, Font Awesome 5, Contact Form 7 y Google Analytics Universal (UA, ya descontinuado). Este proyecto lo reemplaza por un sitio moderno, rápido y responsive que además permite el pago del servicio en línea consumiendo el backend existente.


Rol del agente:

Desarrollador web con 12 años de experiencia.


Objetivo:

- Sitio institucional rápido, accesible y con buen SEO, con el contenido del sitio actual (trámites y servicios, noticias, tarifas, preguntas frecuentes, medidas sanitarias, contacto, política de privacidad y eliminación de cuenta).
- Pago del servicio en línea integrado con el backend existente publicado en Azure (no se crea un backend nuevo para pagos).
- Mantener el mismo stack y las mismas convenciones de otros proyectos del equipo.


Funcionalidades:

- Parte pública (sin necesidad de identificarse):
    - Inicio: avisos destacados (cortes de agua, mantenimientos programados), accesos rápidos a trámites, pago en línea y contacto, y últimas noticias.
    - Trámites y servicios.
    - Noticias (listado con paginación y detalle) y sección "¿Sabías que?".
    - Tarifas: tabla responsive y simulador de consumo.
    - Preguntas frecuentes con buscador.
    - Medidas sanitarias.
    - Contacto: formulario, teléfonos, teléfono de emergencias y botón de WhatsApp siempre visibles.
    - Política de privacidad.
    - Elimina tu cuenta (requerida por la app móvil; debe conservar la misma URL `/elimina-tu-cuenta/`).

- Pago en línea:
    - El usuario consulta su adeudo con su número de contrato o cuenta (los datos exactos se definen al estudiar el backend).
    - Ver el detalle del adeudo o recibo y pagar.
    - Comprobante de pago visible en pantalla y descargable o imprimible.
    - Mensajes claros de éxito, error y pago pendiente.
    - Los métodos del backend que se van a consumir se documentan en la sección "Backend (Azure)" de este archivo después de analizar el código fuente.

- En general:
    - Responsive, mobile first (la mayoría de los usuarios entra desde el celular).
    - Accesibilidad WCAG 2.1 AA (contraste, navegación con teclado, etiquetas en formularios, textos alternativos).
    - SEO: título y descripción por página, Open Graph, `sitemap.xml`, `robots.txt` y datos estructurados (`GovernmentOrganization` / `LocalBusiness`).
    - Redirecciones 301 de las URLs actuales de WordPress a las nuevas para no perder posicionamiento.
    - Mensajes de confirmación y validación de formularios.


Stack de tecnología:

- Astro 5 (sitio estático por defecto; SSR solo en las rutas que lo necesiten).
- React únicamente como "islas" interactivas (`client:load` / `client:visible`): pago en línea, simulador de tarifas, buscador de preguntas frecuentes y formularios. El resto de las páginas son componentes `.astro` sin JavaScript en el cliente.
- Tailwind CSS.
- JavaScript (no TypeScript), salvo que el equipo decida lo contrario.
- Backend existente en Azure, consumido vía su API REST con `fetch` nativo (sin SDK ni librerías HTTP externas).
- Hosting propuesto: Azure Static Web Apps (mismo proveedor que el backend) con deploy automático desde GitHub Actions.
- Analítica: Google Analytics 4 (reemplaza al ID `UA-981770-50`).


Backend (Azure):

- Código fuente: `C:\Users\Uriel Soto\source\repos\WCF-ARM-Pagos-Android` (pendiente).
- Tecnología: WCF (VB.NET, .NET Framework) con `webHttpBinding` JSON, servicio `ComapaVic_OS.svc`. CORS abierto (`*`).
- URL base de la API: variable de entorno `PUBLIC_API_BASE_URL` (incluye `/ComapaVic_OS.svc`).
- Mapa de endpoints que usa el sitio:

| Uso | Método | Endpoint | Autenticación | Notas |
| --- | --- | --- | --- | --- |
| Consultar adeudo | GET | `getDatosPadron?p1={cuenta}` | Ninguna | Devuelve lista; usa `total`, `periodo`, `fecha_vencimiento`, `id_recibo` |
| Historial de recibos | GET | `getHistorialRecibos?p1={cuenta}` | Ninguna | |
| Detalle de recibo | GET | `getDetalleRecibo?p1={idRecibo}` | Ninguna | Conceptos, subtotal, IVA, total |
| Iniciar pago | POST | `GenCargoYP` | `pass` (llave compartida) | BLOQUEADO: no usable desde navegador |
| Confirmar pago / estatus | POST | `ActualizarCargoYP` | `pass` | BLOQUEADO: aplica el pago con `success` enviado por el cliente |
| Comprobante | — | Se genera en el cliente (imprimir/PDF) | — | `GenPdfRecibo` exige `pass` |

- Probado (backend `pagosarm.azurewebsites.net`): `getDatosPadron` devuelve una fila por recibo pendiente (la más antigua primero) con `total` de la cuenta repetido; cuenta inexistente devuelve `[]`. Por HTTPS las operaciones devuelven 404 (solo HTTP funciona): el sitio en HTTPS sería bloqueado por contenido mixto.
- Cambios requeridos en el backend para habilitar el pago web (no se modifica desde este proyecto):
  - Endpoint de checkout del lado servidor sin `pass` en el cliente (o función intermedia con la llave en secreto de Azure).
  - Confirmación del pago por callback/webhook de la pasarela (YoloPago), no por el `success` del cliente.
  - Endpoints para formulario de contacto y baja de cuenta (`PUBLIC_CONTACT_ENDPOINT`); hoy `EnvCodDelEmail`/`DelEmailPerfil` exigen `pass`.
  - `ActualizarCargoYP` concatena SQL con parámetros del cliente (riesgo de inyección SQL): corregir.
  - Restringir CORS al dominio del sitio.

- Revisar en el backend: autenticación (JWT, API key, etc.), pasarela de pago y su flujo de confirmación (webhook o callback), configuración de CORS (el dominio del sitio nuevo debe estar permitido) y modelos/DTOs de respuesta.
- No modificar el backend desde este proyecto. Si hace falta un cambio (CORS, nuevo endpoint), documentarlo y avisar al usuario.


Seguridad:

- Los datos de tarjeta nunca pasan por el código del sitio ni por el backend propio: se usa la tokenización o el checkout de la pasarela de pago.
- Ninguna llave secreta (pasarela de pago, cadenas de conexión, credenciales de Azure) se usa en el frontend. Solo las variables con prefijo `PUBLIC_` llegan al navegador y nunca deben contener secretos.
- El monto a pagar siempre lo calcula y valida el backend; el frontend solo lo muestra.
- No hacer commit de `.env`; mantener `.env.template` actualizado.
- Al analizar el código del backend, no copiar secretos (`appsettings*.json`, `web.config`, `local.settings.json`, `*.pubxml`) a este proyecto ni a la documentación.


Contenido (noticias, avisos, tarifas):

- Origen del contenido: pendiente de decidir (backend de Azure, WordPress actual como CMS headless vía `/wp-json`, Markdown con Content Collections de Astro o Supabase).
- Mientras se decide, el contenido vive en Content Collections (`src/content/`) para poder maquetar.


Preferencias generales:

- Todos los textos visibles en la web deben estar en español.


Preferencias de diseño:

- Basarse en las plantillas HTML de la carpeta `design/` del proyecto.
- Colores, tipografías e iconos los de las plantillas.


Preferencias de estilos:

- Medidas en rem con un font-size base de 10px (`html { font-size: 62.5%; }`).
- HTML5 y CSS3 nativo; Tailwind para utilidades.
- Buenas prácticas de maquetación; flexbox y CSS grid cuando sea necesario.
- Sitio responsive.


Preferencias de código:

- No añadir dependencias externas aparte de Astro, la integración de React y Tailwind, sin preguntar antes.
- HTML semántico.
- Usar siempre `let` o `const`, nunca `var`.
- No usar `alert`, `confirm` ni `prompt`; todo el feedback debe ser visual en el DOM.
- Toda alerta o ventana modal debe tener el mismo estilo que la web.
- No usar `innerHTML` ni `dangerouslySetInnerHTML` (excepto el HTML de contenido ya sanitizado de un CMS, si se elige esa opción).
- Prevenir el default en los eventos submit o click cuando corresponda.
- Priorizar código legible, mantenible y sencillo de entender.
- Todo acceso al backend pasa por `src/services/` (un `apiClient.js` con `fetch` y servicios por dominio, por ejemplo `paymentService.js`); los componentes no llaman a `fetch` directamente.
- Los servicios son asíncronos y los componentes manejan los errores con mensajes visuales.
- Si el agente duda, revisar las especificaciones del proyecto y, si no, preguntar al usuario.


Estructura de archivos (propuesta):

- `design/` (plantillas HTML del diseño)
- `public/` (favicon, imágenes estáticas, `robots.txt`)
- `src/components/` (componentes `.astro`; `src/components/react/` para las islas)
- `src/layouts/` (`BaseLayout.astro` con header, footer, SEO y analítica)
- `src/pages/` (rutas de Astro; mantener los slugs actuales: `/tarifas/`, `/preguntas-frecuentes/`, `/contacto/`, `/medidas-sanitarias/`, `/politica-de-privacidad/`, `/elimina-tu-cuenta/`, `/category/noticias/` → redirección a `/noticias/`)
- `src/content/` (Content Collections, mientras se decide el origen del contenido)
- `src/services/` (acceso al backend)
- `src/styles/` (estilos globales y configuración base de Tailwind)
- `.github/workflows/` (deploy a Azure Static Web Apps)
- `.env.template`


Pendientes / notas:

- Ruta local del código del backend y su tecnología. -- ya suministrado
- Origen del contenido (noticias, avisos, tarifas). *pendiente
- Mapa de endpoints de pago en línea (analizar el backend). -- puedes proceder con ello con los datos que ya te pase
- Pasarela de pago que usa el backend y su flujo de confirmación. *pendiente
- Confirmar hosting (Azure Static Web Apps) y dominio. *pendiente
- Inventario completo de URLs del sitio actual para las redirecciones 301. *pendiente
