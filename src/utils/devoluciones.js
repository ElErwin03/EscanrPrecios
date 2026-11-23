import { pesosACentavos } from './dinero';

// Las devoluciones se guardan junto a las ventas, como registros aparte que apuntan a la
// venta original (ventaId). La venta nunca se modifica. Sin `tipo` = venta.

export const esDevolucion = (entrada) => entrada.tipo === 'devolucion';

/** Map ventaId -> Map(codigo -> piezas ya devueltas) */
export function devueltoPorVenta(entradas) {
  const mapa = new Map();
  for (const e of entradas) {
    if (!esDevolucion(e)) continue;
    const porCodigo = mapa.get(e.ventaId) ?? new Map();
    for (const a of e.articulos) porCodigo.set(a.codigo, (porCodigo.get(a.codigo) ?? 0) + a.cantidad);
    mapa.set(e.ventaId, porCodigo);
  }
  return mapa;
}

/** Artículos de una venta con cuántas piezas ya se devolvieron y cuántas se pueden devolver aún. */
export function articulosDevolvibles(venta, devueltos) {
  const ya = devueltos.get(venta.id);
  return venta.articulos.map((a) => {
    const devuelto = ya?.get(a.codigo) ?? 0;
    return { ...a, devuelto, disponible: a.cantidad - devuelto };
  });
}

/** 'ninguna' | 'parcial' | 'total' */
export function estadoDevolucion(venta, devueltos) {
  const lineas = articulosDevolvibles(venta, devueltos);
  if (lineas.every((l) => l.devuelto === 0)) return 'ninguna';
  return lineas.every((l) => l.disponible <= 0) ? 'total' : 'parcial';
}

/** Totales de una lista de movimientos (ventas y devoluciones) de un día. */
export function resumirDia(entradas) {
  const r = { ventasCentavos: 0, devolucionesCentavos: 0, numVentas: 0, numDevoluciones: 0, numArticulos: 0 };
  for (const e of entradas) {
    const piezas = e.articulos.reduce((s, a) => s + a.cantidad, 0);
    if (esDevolucion(e)) {
      r.devolucionesCentavos += pesosACentavos(e.total);
      r.numDevoluciones += 1;
      r.numArticulos -= piezas;
    } else {
      r.ventasCentavos += pesosACentavos(e.total);
      r.numVentas += 1;
      r.numArticulos += piezas;
    }
  }
  r.netoCentavos = r.ventasCentavos - r.devolucionesCentavos;
  return r;
}
