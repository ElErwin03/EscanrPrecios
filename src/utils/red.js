// Manejo de errores y tiempos de espera de red

export class ErrorRed extends Error {
  constructor(tipo, mensaje) {
    super(mensaje);
    this.tipo = tipo;
  }
}

// Sin internet, Firebase puede quedarse esperando para siempre: ponemos un límite.
export function conTiempoLimite(promesa, ms = 8000) {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new ErrorRed('timeout', 'Sin conexión o conexión muy lenta.')), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

// ¿El fallo es por falta de internet? (entonces se reintenta después)
export function esErrorDeRed(error) {
  if (error instanceof ErrorRed) return error.tipo === 'timeout';
  return /offline|network|unavailable|disconnected/i.test(String(error?.message ?? ''));
}

export function mensajeDeError(error) {
  if (error instanceof ErrorRed) return error.message;
  if (esErrorDeRed(error)) return 'Sin conexión a internet.';
  if (/permission[_ ]denied/i.test(String(error?.code ?? '') + String(error?.message ?? ''))) {
    return 'Firebase rechazó la operación (revisa las reglas de la base de datos).';
  }
  return 'Ocurrió un problema con la base de datos.';
}
