export type VistaActiva = 'inventario' | 'nuevo-producto' | 'movimientos';

export interface Categoria {
  id: number;
  nombre: string;
}

export interface ProductoVista {
  id: number;
  nombre: string;
  categoria: string;
  categoria_id: number;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  stock_bajo: boolean;
}

export type TipoMovimiento = 'entrada' | 'salida';

export interface MovimientoHistorial {
  id: number;
  producto_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  nota: string | null;
  creado_en: string;
  productos: { nombre: string } | { nombre: string }[] | null;
}
