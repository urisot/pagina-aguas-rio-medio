const KEY = 'arm.cuentas';
export const MAX_CUENTAS = 10;

/** Guarda solo los números de cuenta en este navegador; nunca datos personales ni de pago. */
export function leerCuentas() {
  try {
    const lista = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(lista) ? lista.filter((n) => Number.isInteger(n) && n > 0) : [];
  } catch {
    return [];
  }
}

export function guardarCuentas(lista) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lista));
  } catch {
    // Almacenamiento no disponible (modo privado): las cuentas viven solo en la sesión.
  }
}
