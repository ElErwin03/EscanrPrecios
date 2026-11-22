import { useSyncExternalStore } from 'react';
import { suscribir, obtenerEstado } from '../services/sincronizacion';

// Estado de conexión / pendientes, siempre actualizado en cualquier componente
export const useSincronizacion = () => useSyncExternalStore(suscribir, obtenerEstado);
