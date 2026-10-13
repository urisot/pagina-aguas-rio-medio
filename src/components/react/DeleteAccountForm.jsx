import { useState } from 'react';
import Field from './Field.jsx';
import Alert from './Alert.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { solicitarEliminacionCuenta } from '../../services/contactService.js';

const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DeleteAccountForm() {
  const [correo, setCorreo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const pedirConfirmacion = (event) => {
    event.preventDefault();
    if (!correoValido.test(correo)) {
      setError('Escribe el correo con el que te registraste en la app.');
      return;
    }
    setError('');
    setConfirmando(true);
  };

  const enviar = async () => {
    setEnviando(true);
    try {
      await solicitarEliminacionCuenta({ correo, motivo });
      setResultado({ tipo: 'success', mensaje: 'Recibimos tu solicitud. Eliminaremos tu cuenta y tus datos personales en un máximo de 30 días y te avisaremos por correo.' });
      setCorreo('');
      setMotivo('');
    } catch (err) {
      setResultado({ tipo: 'error', mensaje: err.message });
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  };

  return (
    <>
      <form onSubmit={pedirConfirmacion} noValidate className="card space-y-5 !p-6 sm:!p-8">
        <Field id="correo" type="email" label="Correo de tu cuenta en la app" value={correo} onChange={(e) => setCorreo(e.target.value)} error={error} autoComplete="email" required />
        <Field id="motivo" as="textarea" label="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
        {resultado && (
          <Alert type={resultado.tipo} title={resultado.tipo === 'success' ? 'Solicitud enviada' : 'No pudimos enviar la solicitud'}>
            {resultado.mensaje}
          </Alert>
        )}
        <button type="submit" className="btn !bg-error text-white">
          <span className="icon !text-[2rem]" aria-hidden="true">delete_forever</span>
          Solicitar eliminación de mi cuenta
        </button>
      </form>

      <ConfirmDialog
        open={confirmando}
        danger
        title="¿Eliminar tu cuenta?"
        confirmLabel="Sí, eliminar mi cuenta"
        loading={enviando}
        onConfirm={enviar}
        onCancel={() => setConfirmando(false)}
      >
        Se eliminarán tu perfil, tus cuentas vinculadas y tus tarjetas guardadas de la app ARM Móvil. Esta acción no se puede deshacer.
      </ConfirmDialog>
    </>
  );
}
