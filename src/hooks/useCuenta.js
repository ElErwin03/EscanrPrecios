import { useReducer, useMemo, useCallback } from 'react';

// Productos iguales se agrupan en una sola línea con cantidad.
function reducer(items, accion) {
  switch (accion.tipo) {
    case 'agregar': {
      const { producto } = accion;
      const existente = items.find((i) => i.codigo === producto.codigo);
      if (!existente) return [{ ...producto, cantidad: 1 }, ...items];
      // el último escaneado sube al inicio de la lista
      const resto = items.filter((i) => i.codigo !== producto.codigo);
      return [{ ...existente, cantidad: existente.cantidad + 1 }, ...resto];
    }
    case 'incrementar':
      return items.map((i) => (i.codigo === accion.codigo ? { ...i, cantidad: i.cantidad + 1 } : i));
    case 'decrementar':
      return items.flatMap((i) => {
        if (i.codigo !== accion.codigo) return [i];
        return i.cantidad > 1 ? [{ ...i, cantidad: i.cantidad - 1 }] : []; // en 1 se elimina
      });
    case 'limpiar':
      return [];
    default:
      return items;
  }
}

export function useCuenta() {
  const [items, dispatch] = useReducer(reducer, []);

  const agregar = useCallback((producto) => dispatch({ tipo: 'agregar', producto }), []);
  const incrementar = useCallback((codigo) => dispatch({ tipo: 'incrementar', codigo }), []);
  const decrementar = useCallback((codigo) => dispatch({ tipo: 'decrementar', codigo }), []);
  const limpiar = useCallback(() => dispatch({ tipo: 'limpiar' }), []);

  const totalCentavos = useMemo(
    () => items.reduce((suma, i) => suma + i.precioCentavos * i.cantidad, 0),
    [items]
  );
  const totalArticulos = useMemo(() => items.reduce((suma, i) => suma + i.cantidad, 0), [items]);

  return { items, totalCentavos, totalArticulos, agregar, incrementar, decrementar, limpiar };
}
