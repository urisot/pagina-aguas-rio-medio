import { useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import { enviarMensajeContacto } from '../../services/contactService.js';

const vacio = { nombre: '', correo: '', telefono: '', asunto: 'Aclaración', mensaje: '' };
const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(datos) {
  const errores = {};
  if (datos.nombre.trim().length < 3) errores.nombre = 'Escribe tu nombre completo.';
  if (!correoValido.test(datos.correo)) errores.correo = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (datos.telefono && !/^[0-9\s()+-]{10,15}$/.test(datos.telefono)) errores.telefono = 'Escribe un teléfono de 10 dígitos.';
  if (datos.mensaje.trim().length < 10) errores.mensaje = 'Cuéntanos tu mensaje (mínimo 10 caracteres).';
  return errores;
}

export default function ContactForm() {
  const [datos, setDatos] = useState(vacio);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState({ tipo: 'idle', mensaje: '' });

  const cambiar = (event) => setDatos((previo) => ({ ...previo, [event.target.name]: event.target.value }));

  const enviar = async (event) => {
    event.preventDefault();
    const nuevos = validar(datos);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      setEstado({ tipo: 'error', mensaje: 'Revisa los campos marcados en rojo.' });
      return;
    }
    setEstado({ tipo: 'loading', mensaje: '' });
    try {
      await enviarMensajeContacto(datos);
      setDatos(vacio);
      setEstado({ tipo: 'success', mensaje: 'Recibimos tu mensaje. Te responderemos en un máximo de 2 días hábiles.' });
    } catch (error) {
      setEstado({ tipo: 'error', mensaje: error.message });
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="card space-y-5 !p-6 sm:!p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="nombre" label="Nombre completo" value={datos.nombre} onChange={cambiar} error={errores.nombre} autoComplete="name" required />
        <Field id="correo" type="email" label="Correo electrónico" value={datos.correo} onChange={cambiar} error={errores.correo} autoComplete="email" required />
        <Field id="telefono" type="tel" label="Teléfono (opcional)" value={datos.telefono} onChange={cambiar} error={errores.telefono} autoComplete="tel" />
        <Field id="asunto" as="select" label="Asunto" value={datos.asunto} onChange={cambiar}>
          <option>Aclaración</option>
          <option>Reporte de fuga</option>
          <option>Contratación</option>
          <option>Facturación</option>
          <option>Otro</option>
        </Field>
      </div>
      <Field id="mensaje" as="textarea" label="Mensaje" value={datos.mensaje} onChange={cambiar} error={errores.mensaje} rows={5} required />

      {estado.tipo === 'success' && <Alert type="success" title="Mensaje enviado">{estado.mensaje}</Alert>}
      {estado.tipo === 'error' && <Alert type="error" title="No pudimos enviar tu mensaje">{estado.mensaje}</Alert>}

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={estado.tipo === 'loading'}>
        <span className="icon !text-[2rem]" aria-hidden="true">send</span>
        {estado.tipo === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
