import { apiRequest } from './apiClient.js';

export const iniciarSesion = (correo, contrasena) => apiRequest('auth/login', { method: 'POST', body: { correo, contrasena } });

export const cerrarSesion = () => apiRequest('auth/logout', { method: 'POST' });

/** Perfil del usuario con sesión activa. Lanza ApiError con code 'SESION' si no hay sesión. */
export const obtenerSesion = () => apiRequest('auth/sesion');

export const solicitarCodigoRegistro = (datos) => apiRequest('registro/codigo', { method: 'POST', body: datos });

export const reenviarCodigoRegistro = () => apiRequest('registro/reenviar', { method: 'POST' });

export const confirmarRegistro = (codigo) => apiRequest('registro/confirmar', { method: 'POST', body: { codigo } });

export const restablecerContrasena = (correo) => apiRequest('contrasena/restablecer', { method: 'POST', body: { correo } });

/** Foto de perfil en Base64 (la que el usuario subió en la app); cadena vacía si no tiene. */
export const obtenerImagenPerfil = () => apiRequest('perfil/imagen').then((data) => String(data?.imagen || ''));

export const cambiarContrasena =(actual, nueva) => apiRequest('perfil/contrasena', { method: 'POST', body: { actual, nueva } });

/** Lee la cookie no sensible que deja el login para pintar el header sin llamar al API. */
export function nombreEnSesion() {
  const par = document.cookie.split(';').map((p) => p.trim()).find((p) => p.startsWith('arm_nombre='));
  if (!par) return '';
  try {
    return decodeURIComponent(decodeURIComponent(par.slice('arm_nombre='.length)));
  } catch {
    return '';
  }
}

/** Ruta de login que regresa a la página actual después de iniciar sesión. */
export const rutaIngresar = () => `/ingresar/?siguiente=${encodeURIComponent(window.location.pathname + window.location.search)}`;
