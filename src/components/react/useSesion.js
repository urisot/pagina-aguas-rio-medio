import { useEffect, useState } from 'react';
import { obtenerSesion, rutaIngresar } from '../../services/authService.js';

/** Si el API respondió que la sesión terminó, manda al login y regresa true. */
export function siSesionVencida(err) {
  if (err?.code !== 'SESION') return false;
  window.location.assign(rutaIngresar());
  return true;
}

/** Protege una página del portal: carga el perfil o redirige al login. */
export default function useSesion() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerSesion()
      .then(setPerfil)
      .catch((err) => !siSesionVencida(err) && setError(err.message));
  }, []);

  return { perfil, error };
}
