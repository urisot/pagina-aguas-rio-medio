import { useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import { iniciarSesion } from '../../services/authService.js';

// Solo se aceptan rutas internas para evitar redirecciones abiertas.
function destino() {
  const siguiente = new URLSearchParams(window.location.search).get('siguiente') || '';
  return siguiente.startsWith('/') && !siguiente.startsWith('//') ? siguiente : '/pago-en-linea/';
}

export default function LoginForm() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (event) => {
    event.preventDefault();
    const nuevos = {};
    if (!correo.trim()) nuevos.correo = 'Escribe tu correo electrónico.';
    if (!contrasena) nuevos.contrasena = 'Escribe tu contraseña.';
    setErrores(nuevos);
    setError('');
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), contrasena);
      window.location.assign(destino());
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="card mx-auto max-w-xl space-y-5 !p-6 sm:!p-8">
      <h2 className="font-display text-2xl font-extrabold">Inicia sesión</h2>
      <Field id="correo" label="Correo electrónico" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} required />
      <Field id="contrasena" label="Contraseña" type="password" autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} error={errores.contrasena} required />
      {error && <Alert type="error" title="No pudimos iniciar sesión">{error}</Alert>}
      <button type="submit" className="btn btn-primary w-full" disabled={enviando}>
        <span className="icon !text-[2rem]" aria-hidden="true">{enviando ? 'hourglass_top' : 'login'}</span>
        {enviando ? 'Validando…' : 'Iniciar sesión'}
      </button>
      <div className="flex flex-col gap-2 border-t border-primary-brand/10 pt-5 text-sm sm:flex-row sm:justify-between">
        <a href="/restablecer-contrasena/" className="font-semibold text-primary underline-offset-4 hover:underline">¿Olvidaste tu contraseña?</a>
        <p>¿No tienes cuenta? <a href="/registro/" className="font-semibold text-primary underline-offset-4 hover:underline">Regístrate</a></p>
      </div>
    </form>
  );
}
