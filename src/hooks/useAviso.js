import { useState, useRef, useCallback, useEffect } from 'react';

// Mensaje temporal que NO bloquea la pantalla (reemplaza los Alert de cada escaneo)
export function useAviso(duracionMs = 1800) {
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef(null);

  const mostrar = useCallback(
    (texto, tipo = 'ok') => {
      clearTimeout(temporizador.current);
      setAviso({ texto, tipo });
      temporizador.current = setTimeout(() => setAviso(null), duracionMs);
    },
    [duracionMs]
  );

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return { aviso, mostrar };
}
