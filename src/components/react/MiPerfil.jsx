import { useEffect, useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import useSesion, { siSesionVencida } from './useSesion.js';
import { cambiarContrasena, cerrarSesion, obtenerImagenPerfil } from '../../services/authService.js';

const srcImagen = (base64) => (base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`);

function CambiarContrasena() {
  const [campos, setCampos] = useState({ actual: '', nueva: '', confirmacion: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setCampos((previo) => ({ ...previo, [campo]: e.target.value }));

  const enviar = async (event) => {
    event.preventDefault();
    const nuevos = {};
    if (!campos.actual) nuevos.actual = 'Escribe tu contraseña actual.';
    if (campos.nueva.length < 8 || !/[A-Za-z]/.test(campos.nueva) || !/\d/.test(campos.nueva)) {
      nuevos.nueva = 'Usa al menos 8 caracteres, con letras y números.';
    }
    if (campos.confirmacion !== campos.nueva) nuevos.confirmacion = 'Las contraseñas no coinciden.';
    setErrores(nuevos);
    setError('');
    setExito(false);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await cambiarContrasena(campos.actual, campos.nueva);
      setCampos({ actual: '', nueva: '', confirmacion: '' });
      setExito(true);
    } catch (err) {
      if (!siSesionVencida(err)) setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="card space-y-4 !p-6 sm:!p-8" aria-labelledby="contrasena-titulo">
      <h2 id="contrasena-titulo" className="font-display text-xl font-bold">Cambiar contraseña</h2>
      <Field id="actual" label="Contraseña actual" type="password" autoComplete="current-password" value={campos.actual} onChange={cambiar('actual')} error={errores.actual} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="nueva" label="Contraseña nueva" type="password" autoComplete="new-password" value={campos.nueva} onChange={cambiar('nueva')} error={errores.nueva} required />
        <Field id="confirmacion" label="Confirma la contraseña nueva" type="password" autoComplete="new-password" value={campos.confirmacion} onChange={cambiar('confirmacion')} error={errores.confirmacion} required />
      </div>
      {exito && <Alert type="success">Tu contraseña se cambió. Úsala la próxima vez que inicies sesión, también en la app.</Alert>}
      {error && <Alert type="error" title="No pudimos cambiar tu contraseña">{error}</Alert>}
      <button type="submit" className="btn btn-primary" disabled={enviando}>
        <span className="icon !text-[2rem]" aria-hidden="true">{enviando ? 'hourglass_top' : 'key'}</span>
        {enviando ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  );
}

export default function MiPerfil() {
  const { perfil, error } = useSesion();
  const [saliendo, setSaliendo] = useState(false);
  const [imagen, setImagen] = useState('');

  useEffect(() => {
    // La foto es opcional: si no se puede cargar, se quedan las iniciales.
    if (perfil) obtenerImagenPerfil().then(setImagen).catch(() => {});
  }, [perfil]);

  const salir = async () => {
    setSaliendo(true);
    try {
      await cerrarSesion();
    } finally {
      window.location.assign('/');
    }
  };

  if (error) return <Alert type="error" title="No pudimos cargar tu perfil">{error}</Alert>;
  if (!perfil) return <p role="status" className="text-center text-on-surface-variant">Cargando tu perfil…</p>;

  const iniciales = `${perfil.nombres.charAt(0)}${perfil.apellidos.charAt(0)}`.toUpperCase() || 'A';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section aria-labelledby="perfil-titulo" className="card space-y-5 !p-6 sm:!p-8">
        <div className="flex items-center gap-4">
          {imagen ? (
            <img src={srcImagen(imagen)} alt="Tu foto de perfil" width="96" height="96" className="h-24 w-24 flex-shrink-0 rounded-full object-cover ring-4 ring-primary-brand/10" onError={() => setImagen('')} />
          ) : (
            <span className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-primary-brand font-display text-3xl font-extrabold text-white" aria-hidden="true">{iniciales}</span>
          )}
          <div className="min-w-0">
            <h2 id="perfil-titulo" className="font-display text-xl font-bold">{perfil.nombre || `${perfil.nombres} ${perfil.apellidos}`}</h2>
            <p className="truncate text-sm text-on-surface-variant">{perfil.correo}</p>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <div><dt className="text-on-surface-variant">Nombre(s)</dt><dd className="font-semibold">{perfil.nombres || '—'}</dd></div>
          <div><dt className="text-on-surface-variant">Apellidos</dt><dd className="font-semibold">{perfil.apellidos || '—'}</dd></div>
          <div><dt className="text-on-surface-variant">Correo electrónico</dt><dd className="font-semibold">{perfil.correo || '—'}</dd></div>
          <div><dt className="text-on-surface-variant">Celular</dt><dd className="font-semibold">{perfil.celular || '—'}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-3 border-t border-primary-brand/10 pt-5">
          <button type="button" className="btn btn-ghost" onClick={salir} disabled={saliendo}>
            <span className="icon !text-[2rem]" aria-hidden="true">logout</span> {saliendo ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
          <a href="/elimina-tu-cuenta/" className="btn btn-ghost !text-error">Eliminar mi cuenta</a>
        </div>
      </section>
      <CambiarContrasena />
    </div>
  );
}
