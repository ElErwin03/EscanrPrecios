import { AppState } from 'react-native';
import { ref, get, set, onValue } from 'firebase/database';
import { db } from '../config/firebase';
import { pesosACentavos } from '../utils/dinero';
import { conTiempoLimite, esErrorDeRed, mensajeDeError } from '../utils/red';
import * as catalogo from './catalogoLocal';
import * as cola from './colaSincronizacion';
import * as ventasLocal from './ventasLocal';

/**
 * Motor de sincronización:
 *  - Detecta si hay conexión con Firebase (.info/connected).
 *  - Al haber conexión: 1) envía lo pendiente (ventas y productos), 2) descarga el catálogo.
 *  - Se vuelve a ejecutar al reconectar, al volver a la app y cada 5 minutos.
 */

const REFRESCO_CATALOGO_MS = 5 * 60 * 1000;
const TIEMPO_DESCARGA_MS = 20000;

let estado = {
  listo: false, // ya se cargaron catálogo y cola del disco
  enLinea: false,
  sincronizando: false,
  pendientes: 0,
  productosLocales: 0,
  ultimaSync: null,
  error: null,
};
const oyentes = new Set();

function emitir(parcial) {
  estado = { ...estado, ...parcial };
  oyentes.forEach((f) => f());
}

export const suscribir = (f) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};
export const obtenerEstado = () => estado;

// ---------- Envío y descarga ----------

async function enviar(op) {
  if (op.tipo === 'producto') {
    const { codigo, nombre, precioCentavos } = op.datos;
    await conTiempoLimite(
      set(ref(db, `productos/${catalogo.claveProducto(codigo)}`), { nombre, precio: precioCentavos / 100 })
    );
  } else if (op.tipo === 'venta') {
    // El id de la operación es la clave: reenviar la misma venta nunca la duplica
    await conTiempoLimite(set(ref(db, `ventas/${op.id}`), op.datos));
  } else {
    throw new Error(`Operación desconocida: ${op.tipo}`);
  }
}

// Envía la cola en orden. Si se pierde internet se detiene (error de red);
// si Firebase rechaza una operación, se marca y se sigue con las demás.
async function subirPendientes() {
  const intentadas = new Set();
  let fallos = 0;
  for (;;) {
    const op = cola.listar().find((o) => !intentadas.has(o.id));
    if (!op) break;
    intentadas.add(op.id);
    try {
      await enviar(op);
      await cola.quitar(op.id);
    } catch (error) {
      if (esErrorDeRed(error)) throw error;
      fallos += 1;
      await cola.marcarFallo(op.id, mensajeDeError(error));
    }
  }
  return fallos;
}

async function descargarCatalogo() {
  const snapshot = await conTiempoLimite(get(ref(db, 'productos')), TIEMPO_DESCARGA_MS);
  const nuevos = new Map();
  if (snapshot.exists()) {
    for (const [clave, datos] of Object.entries(snapshot.val())) {
      const precioCentavos = pesosACentavos(datos?.precio);
      if (!datos?.nombre || Number.isNaN(precioCentavos)) continue; // dato incompleto: se ignora
      nuevos.set(clave, { codigo: clave, nombre: datos.nombre, precioCentavos });
    }
  }
  await catalogo.reemplazarDesdeServidor(nuevos, cola.listar());
}

let enCurso = null;
let repetir = false;
let descargarPedida = false;

async function ejecutar() {
  emitir({ sincronizando: true });
  let error = null;
  try {
    do {
      repetir = false;
      const fallos = await subirPendientes();
      error = fallos ? `${fallos} registro(s) no se pudieron enviar` : null;
      if (descargarPedida) {
        descargarPedida = false;
        await descargarCatalogo();
      }
    } while (repetir); // llegó algo nuevo mientras se sincronizaba
    emitir({ ultimaSync: Date.now() });
  } catch (e) {
    error = mensajeDeError(e);
  } finally {
    emitir({ sincronizando: false, error });
  }
}

/** Sincroniza ahora (si hay conexión). Nunca lanza error: el resultado queda en el estado. */
export function sincronizar({ descargar = false } = {}) {
  if (!estado.enLinea) return Promise.resolve();
  if (descargar) descargarPedida = true;
  if (enCurso) {
    repetir = true;
    return enCurso;
  }
  enCurso = ejecutar().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

// ---------- Arranque ----------

let inicio = null;

export function iniciar() {
  if (!inicio) inicio = arrancar();
  return inicio;
}

async function arrancar() {
  await Promise.all([catalogo.cargar(), cola.cargar(), ventasLocal.cargar()]);
  catalogo.restaurarPendientes(cola.listar()); // por si se cerró la app antes de guardar el catálogo

  emitir({ listo: true, pendientes: cola.cantidad(), productosLocales: catalogo.total() });
  cola.suscribir(() => emitir({ pendientes: cola.cantidad() }));
  catalogo.suscribir(() => emitir({ productosLocales: catalogo.total() }));

  // Firebase avisa solo cuando se conecta o se desconecta
  onValue(
    ref(db, '.info/connected'),
    (snap) => {
      const enLinea = snap.val() === true;
      const estabaEnLinea = estado.enLinea;
      emitir({ enLinea });
      if (enLinea && !estabaEnLinea) sincronizar({ descargar: true });
    },
    () => emitir({ enLinea: false })
  );

  const catalogoViejo = () => Date.now() - catalogo.obtenerUltimaDescarga() > REFRESCO_CATALOGO_MS;

  AppState.addEventListener('change', (siguiente) => {
    if (siguiente === 'active') sincronizar({ descargar: catalogoViejo() });
    else catalogo.vaciar(); // al salir de la app, asegurar el guardado en disco
  });

  setInterval(() => sincronizar({ descargar: catalogoViejo() }), REFRESCO_CATALOGO_MS);
}
