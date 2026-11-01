import { useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import { restablecerContrasena } from '../../services/authService.js';

export default function RestableceForm() {
  const [correo, setCorreo] = useState('');
  const [errorCampo, setErrorCampo] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim())) {
      setErrorCampo('Escribe un correo electrónico válido.');
      return;
    }
    setErrorCampo('');
    setEnviando(true);
    try {
      await restablecerContrasena(correo.trim());
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="card mx-auto max-w-xl space-y-5 !p-6 sm:!p-8">
        <Alert type="success" title="Revisa tu correo">
          Si {correo.trim()} está registrado, te enviamos una contraseña temporal. Úsala para iniciar sesión y cámbiala desde Mi perfil.
        </Alert>
        <a href="/ingresar/" className="btn btn-primary w-full">Ir a iniciar sesión</a>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="card mx-auto max-w-xl space-y-5 !p-6 sm:!p-8">
      <h2 className="font-display text-2xl font-extrabold">Restablece tu contraseña</h2>
      <p className="text-sm text-on-surface-variant">Te enviaremos una contraseña temporal al correo con el que te registraste.</p>
      <Field id="correo" label="Correo electrónico" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errorCampo} required />
      {error && <Alert type="error" title="No pudimos enviar el correo">{error}</Alert>}
      <button type="submit" className="btn btn-primary w-full" disabled={enviando}>
        <span className="icon !text-[2rem]" aria-hidden="true">{enviando ? 'hourglass_top' : 'lock_reset'}</span>
        {enviando ? 'Enviando…' : 'Enviar contraseña temporal'}
      </button>
      <p className="border-t border-primary-brand/10 pt-5 text-sm"><a href="/ingresar/" className="font-semibold text-primary underline-offset-4 hover:underline">Volver a iniciar sesión</a></p>
    </form>
  );
}
