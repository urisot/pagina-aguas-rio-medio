import { app } from '@azure/functions';
import { rutas } from './_rutas/index.js';

// Entrada para Azure Static Web Apps / Azure Functions (package.json "main"). Vercel usa portal.js.
for (const r of rutas) {
  app.http(r.nombre, {
    methods: r.methods,
    route: r.route,
    authLevel: 'anonymous',
    handler: (request, context) => r.handler(request, context),
  });
}
