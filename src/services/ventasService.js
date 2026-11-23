import * as catalogo from './catalogoLocal';
import * as cola from './colaSincronizacion';
import * as ventasLocal from './ventasLocal';
import { sincronizar } from './sincronizacion';
import { estadoStock } from '../utils/inventario';
import { pesosACentavos } from '../utils/dinero';
import { articulosDevolvibles, devueltoPorVenta } from '../utils/devoluciones';

/**
 * Registra una venta terminada. Se guarda en el celular al instante y se envía a
 * Firebase (ventas/<id>) en cuanto haya internet. Lanza error si no se pudo guardar.
 * También descuenta del inventario los productos que lo llevan.
 * Devuelve { bajos }: productos que quedaron agotados o con poco inventario por esta venta.
 */
export async function registrarVenta({ items, totalCentavos, recibidoCentavos, cambioCentavos }) {
  const ahora = new Date();
  const datos = {
    fecha: ahora.toISOString(),
    timestamp: ahora.getTime(),
    total: totalCentavos / 100,
    recibido: recibidoCentavos / 100,
    cambio: cambioCentavos / 100,
    articulos: items.map((i) => ({
      codigo: i.codigo,
      nombre: i.nombre,
      precio: i.precioCentavos / 100,
      cantidad: i.cantidad,
    })),
  };

  // Existencias nuevas (usa la existencia ACTUAL del catálogo, no la del momento de escanear).
  // Nunca baja de 0. Los productos sin control de inventario no se tocan.
  const stockNuevo = {};
  const bajos = [];
  for (const item of items) {
    const producto = catalogo.buscar(item.codigo);
    if (!producto || producto.stock == null) continue;
    const nuevo = Math.max(0, producto.stock - item.cantidad);
    stockNuevo[producto.codigo] = nuevo;
    const estado = estadoStock({ ...producto, stock: nuevo });
    if (estado === 'agotado' || estado === 'bajo') bajos.push({ nombre: producto.nombre, stock: nuevo, estado });
  }

  // La cola es lo importante (si falla, se avisa). Lo demás es un extra.
  const operacion = await cola.encolar('venta', datos, { stock: stockNuevo });
  catalogo.aplicarStock(stockNuevo);
  try {
    await ventasLocal.guardar(operacion.id, datos);
  } catch {
    // la venta igual se enviará a Firebase
  }
  sincronizar();
  return { bajos };
}

/**
 * Registra la devolución (total o parcial) de una venta ya cobrada.
 *  - cantidades: { codigo: piezas a devolver }
 *  - reponer: si las piezas regresan al inventario (false si el producto está dañado)
 * La venta original no se modifica: se guarda un registro nuevo en devoluciones/<id>.
 * Devuelve { totalCentavos, piezasRepuestas }. Lanza error si no se pudo guardar.
 */
export async function registrarDevolucion({ venta, cantidades, reponer }) {
  const devueltos = devueltoPorVenta(ventasLocal.listar());

  const lineas = [];
  for (const a of articulosDevolvibles(venta, devueltos)) {
    const n = cantidades[a.codigo] ?? 0;
    if (n <= 0) continue;
    if (n > a.disponible) throw new Error('No se puede devolver más de lo vendido');
    lineas.push({ codigo: a.codigo, nombre: a.nombre, precio: a.precio, cantidad: n });
  }
  if (lineas.length === 0) throw new Error('No hay artículos para devolver');

  const totalCentavos = lineas.reduce((s, l) => s + pesosACentavos(l.precio) * l.cantidad, 0);

  // Existencias nuevas (solo productos con control de inventario)
  const stockNuevo = {};
  let piezasRepuestas = 0;
  if (reponer) {
    for (const l of lineas) {
      const producto = catalogo.buscar(l.codigo);
      if (!producto || producto.stock == null) continue;
      stockNuevo[producto.codigo] = producto.stock + l.cantidad;
      piezasRepuestas += l.cantidad;
    }
  }

  const ahora = new Date();
  const id = cola.nuevoId();
  const datos = {
    tipo: 'devolucion',
    ventaId: venta.id,
    fecha: ahora.toISOString(),
    timestamp: ahora.getTime(),
    total: totalCentavos / 100,
    repuesto: reponer,
    articulos: lineas,
  };

  // El historial local es lo que impide devolver dos veces lo mismo: va primero
  await ventasLocal.guardar(id, datos);
  try {
    await cola.encolar('devolucion', datos, { id, stock: stockNuevo });
  } catch (error) {
    await ventasLocal.quitar(id);
    throw error;
  }
  catalogo.aplicarStock(stockNuevo);
  sincronizar();
  return { totalCentavos, piezasRepuestas };
}
