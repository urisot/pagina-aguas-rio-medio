import { ruta, json, HttpError } from '../lib/http.js';
import { llamarWcf } from '../lib/wcf.js';
import { datosDelUsuario } from '../lib/usuarios.js';
import * as normalizar from '../lib/normalizar.js';

// Los reportes del usuario vienen en DatUsrApp (tabla 2 de usp_Qry_DatosUsrApp).
const reportesDelUsuario = async (idUsuarioApp) => (await datosDelUsuario(idUsuarioApp)).reportes;

ruta('reportes', {
  methods: ['GET'],
  route: 'reportes',
  handler: async ({ usuario }) => json(200, await reportesDelUsuario(usuario.idUsuarioApp)),
});

ruta('reporte', {
  methods: ['GET'],
  route: 'reportes/{folio}',
  handler: async ({ request, usuario }) => {
    const folio = String(request.params.folio || '').trim();
    const reporte = (await reportesDelUsuario(usuario.idUsuarioApp)).find((r) => r.folio === folio);
    if (!reporte) throw new HttpError(404, 'No encontramos ese reporte entre los tuyos.');

    const body = { cIdUsuarioApp: usuario.idUsuarioApp, folio_reporte: folio };
    // LisHisRpt puede no existir aún en el servidor: sin historial se muestra solo el estatus actual.
    const [detalle, historial] = await Promise.all([
      llamarWcf('DetRpt', { body }),
      llamarWcf('LisHisRpt', { body }).catch(() => []),
    ]);

    return json(200, {
      ...reporte,
      descripcion: String(detalle?.observa_a || '').trim(),
      direccion: String(detalle?.direccion || '').trim(),
      foto: String(detalle?.foto1 || '').trim(),
      historial: normalizar.lista(historial).map(normalizar.pasoReporte),
    });
  },
});
