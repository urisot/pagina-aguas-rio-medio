import { useEffect, useRef, useState } from 'react';
import { nombreEnSesion, cerrarSesion } from '../../services/authService.js';

// Mismas secciones que PortalNav.astro.
const OPCIONES = [
  { label: 'Mis recibos', href: '/pago-en-linea/', icon: 'receipt_long' },
  { label: 'Mis reportes', href: '/mis-reportes/', icon: 'assignment' },
  { label: 'Mi perfil', href: '/mi-perfil/', icon: 'person' },
];

const claseOpcion = 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-display text-sm font-bold transition';

/**
 * Botón del header según la cookie de sesión, sin llamar al API:
 * sin sesión es "Ingresar"; con sesión abre un menú con las secciones del portal y "Cerrar sesión".
 */
export default function SesionBoton() {
  const [nombre, setNombre] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const contenedor = useRef(null);
  const boton = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    setNombre(nombreEnSesion());
  }, []);

  useEffect(() => {
    if (!abierto) return undefined;
    menu.current?.querySelector('a, button')?.focus();

    const alClicFuera = (event) => {
      if (!contenedor.current?.contains(event.target)) setAbierto(false);
    };
    const alTeclear = (event) => {
      if (event.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const items = [...(menu.current?.querySelectorAll('a, button') || [])];
      const actual = items.indexOf(document.activeElement);
      const siguiente = event.key === 'ArrowDown' ? actual + 1 : actual - 1;
      items[(siguiente + items.length) % items.length]?.focus();
    };

    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  const salir = async (event) => {
    event.preventDefault();
    setSaliendo(true);
    try {
      await cerrarSesion();
    } finally {
      window.location.assign('/');
    }
  };

  if (!nombre) {
    return (
      <a href="/ingresar/" className="btn btn-ghost !h-[4.2rem] whitespace-nowrap !rounded-full !px-4 sm:!px-5" aria-label="Ingresar a mi cuenta">
        <span className="icon !text-[1.8rem]" aria-hidden="true">login</span>
        <span className="hidden sm:inline">Ingresar</span>
      </a>
    );
  }

  const ruta = window.location.pathname;

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        ref={boton}
        className="btn btn-ghost !h-[4.2rem] whitespace-nowrap !rounded-full !px-4 sm:!px-5"
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-controls="menu-sesion"
        aria-label={`Mi cuenta, ${nombre}`}
        onClick={() => setAbierto((previo) => !previo)}
      >
        <span className="icon !text-[1.8rem]" aria-hidden="true">account_circle</span>
        <span className="hidden max-w-[12rem] truncate sm:inline">{nombre.split(' ')[0]}</span>
        <span className={`icon !text-[1.8rem] transition ${abierto ? 'rotate-180' : ''}`} aria-hidden="true">expand_more</span>
      </button>

      {abierto && (
        <div ref={menu} id="menu-sesion" className="absolute right-0 top-[calc(100%+0.8rem)] z-[60] w-[24rem] animate-rise rounded-2xl border border-slate-100 bg-white p-2 shadow-modal">
          <p className="truncate px-4 pb-2 pt-3 text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant">{nombre}</p>
          <ul>
            {OPCIONES.map((opcion) => {
              const activa = ruta.startsWith(opcion.href);
              return (
                <li key={opcion.href}>
                  <a
                    href={opcion.href}
                    aria-current={activa ? 'page' : undefined}
                    className={`${claseOpcion} ${activa ? 'bg-surface-container text-primary' : 'text-on-surface hover:bg-surface-container hover:text-primary'}`}
                  >
                    <span className="icon !text-[2rem] text-primary-brand" aria-hidden="true">{opcion.icon}</span>
                    {opcion.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 border-t border-slate-100 pt-1">
            <button type="button" className={`${claseOpcion} text-error hover:bg-error-container`} onClick={salir} disabled={saliendo}>
              <span className="icon !text-[2rem]" aria-hidden="true">{saliendo ? 'hourglass_top' : 'logout'}</span>
              {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
