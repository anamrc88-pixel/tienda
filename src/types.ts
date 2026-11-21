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
