import { useSyncExternalStore } from 'react';
import { suscribir, listar } from '../services/ventasLocal';

export const useVentasLocales = () => useSyncExternalStore(suscribir, listar);
