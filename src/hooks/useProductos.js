import { useSyncExternalStore } from 'react';
import { suscribir, listar } from '../services/catalogoLocal';

// Lista de productos del catálogo local, siempre actualizada
export const useProductos = () => useSyncExternalStore(suscribir, listar);
