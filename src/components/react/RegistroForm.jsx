import { useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import { solicitarCodigoRegistro, reenviarCodigoRegistro, confirmarRegistro } from '../../services/authService.js';

const VACIO = { nombres: '', apellidos: '', correo: '', celular: '', contrasena: '', confirmacion: '' };

function validar(datos, aceptaPrivacidad) {
  const errores = {};
  if (!datos.nombres.trim()) errores.nombres = 'Escribe tu nombre.';
  if (!datos.apellidos.trim()) errores.apellidos = 'Escribe tus apellidos.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo.trim())) errores.correo = 'Escribe un correo electrónico válido.';
  if (datos.celular.replace(/\D/g, '').length !== 10) errores.celular = 'Escribe tu celular a 10 dígitos.';
  if (datos.contrasena.length < 8 || !/[A-Za-z]/.test(datos.contrasena) || !/\d/.test(datos.contrasena)) {
    errores.contrasena = 'Usa al menos 8 caracteres, con letras y números.';
  }
  if (datos.confirmacion !== datos.contrasena) errores.confirmacion = 'Las contraseñas no coinciden.';
  if (!aceptaPrivacidad) errores.privacidad = 'Debes aceptar el aviso de privacidad.';
  return errores;
}

export default function RegistroForm() {
  const [paso, setPaso] = useState('datos');
  const [datos, setDatos] = useState(VACIO);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setDatos((previo) => ({ ...previo, [campo]: e.target.value }));

  const pedirCodigo = async (event) => {
    event.preventDefault();
    const nuevos = validar(datos, aceptaPrivacidad);
    setErrores(nuevos);
    setError('');
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const { confirmacion, ...cuerpo } = datos;
      await solicitarCodigoRegistro({ ...cuerpo, aceptaPrivacidad });
      setPaso('codigo');
      setAviso(`Enviamos un código de 6 dígitos a ${datos.correo.trim()}. Revisa también la carpeta de spam.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(codigo.trim())) {
      setErrores({ codigo: 'El código tiene 6 dígitos.' });
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      const respuesta = await confirmarRegistro(codigo.trim());
      window.location.assign(respuesta?.iniciarSesion ? '/ingresar/' : '/pago-en-linea/');
    } catch (err) {
      setError(err.message);
      if (err.status === 410) setPaso('datos');
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    setError('');
    setAviso('');
    try {
      await reenviarCodigoRegistro();
      setAviso('Te enviamos un código nuevo.');
    } catch (err) {
      setError(err.message);
      if (err.status === 410) setPaso('datos');
    }
  };

  if (paso === 'codigo') {
    return (
      <form onSubmit={confirmar} noValidate className="card mx-auto max-w-xl space-y-5 !p-6 sm:!p-8">
        <p className="text-sm font-bold text-on-surface-variant">Paso 2 de 2</p>
        <h2 className="font-display text-2xl font-extrabold">Confirma tu correo</h2>
        {aviso && <Alert type="info">{aviso}</Alert>}
        <Field id="codigo" label="Código de verificación" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value)} error={errores.codigo} required />
        {error && <Alert type="error" title="No pudimos crear tu cuenta">{error}</Alert>}
        <button type="submit" className="btn btn-primary w-full" disabled={enviando}>
          <span className="icon !text-[2rem]" aria-hidden="true">{enviando ? 'hourglass_top' : 'how_to_reg'}</span>
          {enviando ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
        </button>
        <div className="flex flex-wrap justify-between gap-3 border-t border-primary-brand/10 pt-5">
          <button type="button" className="btn btn-ghost" onClick={reenviar}>Reenviar código</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setPaso('datos'); setError(''); }}>Corregir mis datos</button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={pedirCodigo} noValidate className="card mx-auto max-w-2xl space-y-5 !p-6 sm:!p-8">
      <p className="text-sm font-bold text-on-surface-variant">Paso 1 de 2</p>
      <h2 className="font-display text-2xl font-extrabold">Crea tu cuenta</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="nombres" label="Nombre(s)" autoComplete="given-name" value={datos.nombres} onChange={cambiar('nombres')} error={errores.nombres} required />
        <Field id="apellidos" label="Apellidos" autoComplete="family-name" value={datos.apellidos} onChange={cambiar('apellidos')} error={errores.apellidos} required />
        <Field id="correo" label="Correo electrónico" type="email" autoComplete="email" value={datos.correo} onChange={cambiar('correo')} error={errores.correo} required />
        <Field id="celular" label="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={datos.celular} onChange={cambiar('celular')} error={errores.celular} hint="10 dígitos, sin espacios." required />
        <Field id="contrasena" label="Contraseña" type="password" autoComplete="new-password" value={datos.contrasena} onChange={cambiar('contrasena')} error={errores.contrasena} hint="Al menos 8 caracteres, con letras y números." required />
        <Field id="confirmacion" label="Confirma tu contraseña" type="password" autoComplete="new-password" value={datos.confirmacion} onChange={cambiar('confirmacion')} error={errores.confirmacion} required />
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-primary-brand" checked={aceptaPrivacidad} onChange={(e) => setAceptaPrivacidad(e.target.checked)} aria-describedby={errores.privacidad ? 'privacidad-error' : undefined} />
          <span>He leído y acepto el <a href="/politica-de-privacidad/" className="font-semibold text-primary underline" target="_blank" rel="noopener">aviso de privacidad</a>.</span>
        </label>
        {errores.privacidad && <p id="privacidad-error" className="field-error"><span className="icon !text-[1.8rem]" aria-hidden="true">error</span>{errores.privacidad}</p>}
      </div>
      {error && <Alert type="error" title="No pudimos enviar tu código">{error}</Alert>}
      <button type="submit" className="btn btn-primary w-full" disabled={enviando}>
        <span className="icon !text-[2rem]" aria-hidden="true">{enviando ? 'hourglass_top' : 'mail'}</span>
        {enviando ? 'Enviando código…' : 'Enviar código a mi correo'}
      </button>
      <p className="border-t border-primary-brand/10 pt-5 text-sm">¿Ya tienes cuenta? <a href="/ingresar/" className="font-semibold text-primary underline-offset-4 hover:underline">Inicia sesión</a></p>
    </form>
  );
}
