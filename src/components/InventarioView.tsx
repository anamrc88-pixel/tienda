import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Categoria, ProductoVista } from '../types';
import { formatearPrecio, normalizarTexto } from '../utils/format';

interface InventarioViewProps {
  onNuevoProducto: () => void;
}

export function InventarioView({ onNuevoProducto }: InventarioViewProps) {
  const [productos, setProductos] = useState<ProductoVista[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [totalMovimientos, setTotalMovimientos] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');

  const cargarInventario = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);

    try {
      const [resProductos, resCategorias, resMovimientos] = await Promise.all([
        supabase
          .from('vista_productos')
          .select(
            'id, nombre, categoria, categoria_id, precio, stock_actual, stock_minimo, stock_bajo'
          )
          .order('id', { ascending: true }),
        supabase
          .from('categorias')
          .select('id, nombre')
          .order('nombre', { ascending: true }),
        supabase
          .from('movimientos')
          .select('id', { count: 'exact', head: true }),
      ]);

      const primerError =
        resProductos.error ?? resCategorias.error ?? resMovimientos.error;

      if (primerError) {
        setErrorCarga(
          `${primerError.message}${primerError.hint ? ` (${primerError.hint})` : ''}`
        );
        return;
      }

      setProductos((resProductos.data as ProductoVista[]) ?? []);
      setCategorias((resCategorias.data as Categoria[]) ?? []);
      setTotalMovimientos(resMovimientos.count ?? 0);
    } catch (err) {
      setErrorCarga(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con Supabase para leer el inventario.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarInventario();
  }, [cargarInventario]);

  const totalProductos = productos.length;
  const totalStockBajo = useMemo(
    () => productos.filter((p) => p.stock_bajo).length,
    [productos]
  );

  const productosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    return productos.filter((producto) => {
      const coincideNombre =
        termino === '' || normalizarTexto(producto.nombre).includes(termino);
      const coincideCategoria =
        categoriaFiltro === 'todas' ||
        String(producto.categoria_id) === categoriaFiltro;
      return coincideNombre && coincideCategoria;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const hayFiltrosActivos =
    busqueda.trim() !== '' || categoriaFiltro !== 'todas';

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaFiltro('todas');
  };

  return (
    <section aria-labelledby="titulo-inventario">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id="titulo-inventario"
            className="font-display text-2xl font-bold text-[#16202A] sm:text-3xl"
          >
            Inventario
          </h1>
          <p className="mt-1 max-w-[65ch] text-sm text-[#5A6572]">
            Lo que hay en la tienda y lo que toca pedir.
          </p>
        </div>

        <button
          type="button"
          onClick={onNuevoProducto}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xs bg-[#146C43] px-4 py-2 text-sm font-semibold text-[#FFFFFF] transition-colors duration-150 hover:bg-[#105736] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Nuevo producto</span>
        </button>
      </div>

      {errorCarga && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xs border border-[#C82333] bg-[#FDF2F2] p-4 text-[#C82333]"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold">
                No se pudo cargar el inventario desde Supabase
              </p>
              <p className="mt-1 text-[#16202A]">{errorCarga}</p>
              <p className="mt-1.5 text-xs text-[#16202A]">
                Verifica tu conexión a internet o los permisos de lectura de
                vista_productos y vuelve a intentarlo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void cargarInventario()}
            className="min-h-[40px] rounded-xs border border-[#C82333] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#C82333] transition-colors duration-150 hover:bg-[#FDF2F2] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C82333]"
          >
            Reintentar carga
          </button>
        </div>
      )}

      {/* Resumen contable en tres bloques unidos por renglones */}
      <div
        aria-label="Resumen del inventario"
        className="mb-6 grid grid-cols-1 divide-y divide-[#D8DEE6] rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-[#5A6572]">Productos</p>
          {cargando ? (
            <div className="mt-2 h-8 w-14 rounded-xs bg-[#E8ECF1]" />
          ) : (
            <p className="mt-1 font-display text-3xl font-bold text-[#16202A] tabular-nums">
              {totalProductos}
            </p>
          )}
        </div>

        <div
          className={`px-5 py-4 ${
            !cargando && totalStockBajo > 0 ? 'bg-[#FDF2F2]' : ''
          }`}
        >
          <p className="text-sm font-medium text-[#5A6572]">Con stock bajo</p>
          {cargando ? (
            <div className="mt-2 h-8 w-14 rounded-xs bg-[#E8ECF1]" />
          ) : (
            <p
              className={`mt-1 font-display text-3xl font-bold tabular-nums ${
                totalStockBajo > 0 ? 'text-[#C82333]' : 'text-[#16202A]'
              }`}
            >
              {totalStockBajo}
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-sm font-medium text-[#5A6572]">
            Movimientos registrados
          </p>
          {cargando ? (
            <div className="mt-2 h-8 w-14 rounded-xs bg-[#E8ECF1]" />
          ) : (
            <p className="mt-1 font-display text-3xl font-bold text-[#16202A] tabular-nums">
              {totalMovimientos}
            </p>
          )}
        </div>
      </div>

      {/* Buscador y filtro por categoría */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5A6572]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              aria-label="Buscar producto por nombre"
              className="min-h-[42px] w-full rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] py-2 pr-9 pl-9 text-sm text-[#16202A] placeholder:text-[#5A6572] focus-visible:border-[#146C43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
            />
            {busqueda !== '' && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Borrar búsqueda"
                className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xs text-[#5A6572] hover:text-[#16202A] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-56">
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              aria-label="Filtrar por categoría"
              className="min-h-[42px] w-full appearance-none rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] py-2 pr-9 pl-3 text-sm text-[#16202A] cursor-pointer focus-visible:border-[#146C43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={String(categoria.id)}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#5A6572]"
              aria-hidden="true"
            />
          </div>
        </div>

        {!cargando && !errorCarga && (
          <p className="text-xs font-medium text-[#5A6572] tabular-nums whitespace-nowrap">
            {hayFiltrosActivos
              ? `Mostrando ${productosFiltrados.length} de ${totalProductos}`
              : `${totalProductos} ${
                  totalProductos === 1 ? 'producto' : 'productos'
                }`}
          </p>
        )}
      </div>

      {/* Tabla contable de productos */}
      <div className="overflow-x-auto rounded-xs border border-[#D8DEE6] bg-[#FFFFFF]">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#D8DEE6] bg-[#F7F8FA] text-[#5A6572]">
              <th scope="col" className="px-5 py-3 font-semibold">
                Producto
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Categoría
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Precio
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Stock
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Mínimo
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Estado
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#D8DEE6]">
            {cargando ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx}>
                  <td className="px-5 py-3.5">
                    <div className="h-4 w-36 rounded-xs bg-[#E8ECF1]" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-20 rounded-xs bg-[#E8ECF1]" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="ml-auto h-4 w-16 rounded-xs bg-[#E8ECF1]" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="ml-auto h-4 w-8 rounded-xs bg-[#E8ECF1]" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="ml-auto h-4 w-8 rounded-xs bg-[#E8ECF1]" />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-4 w-20 rounded-xs bg-[#E8ECF1]" />
                  </td>
                </tr>
              ))
            ) : errorCarga ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[#5A6572]">
                  No se pueden mostrar los productos hasta resolver el error de
                  conexión.
                </td>
              </tr>
            ) : totalProductos === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center">
                  <p className="font-medium text-[#16202A]">
                    Todavía no hay productos en la tienda.
                  </p>
                  <p className="mt-1 text-sm text-[#5A6572]">
                    Agrega el primer producto desde «Nuevo producto» para
                    empezar a llevar la cuenta.
                  </p>
                </td>
              </tr>
            ) : productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center">
                  <p className="font-medium text-[#16202A]">
                    Ningún producto coincide con tu búsqueda.
                  </p>
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="mt-3 inline-flex min-h-[40px] items-center rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#16202A] transition-colors duration-150 hover:border-[#16202A] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
                  >
                    Quitar filtros
                  </button>
                </td>
              </tr>
            ) : (
              productosFiltrados.map((producto) => (
                <tr
                  key={producto.id}
                  className={
                    producto.stock_bajo ? 'bg-[#FEF9F9]' : 'bg-[#FFFFFF]'
                  }
                >
                  <td className="px-5 py-3 font-medium text-[#16202A]">
                    {producto.nombre}
                  </td>
                  <td className="px-4 py-3 text-[#5A6572]">
                    {producto.categoria}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#16202A] tabular-nums">
                    {formatearPrecio(producto.precio)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      producto.stock_bajo ? 'text-[#C82333]' : 'text-[#16202A]'
                    }`}
                  >
                    {producto.stock_actual}
                  </td>
                  <td className="px-4 py-3 text-right text-[#5A6572] tabular-nums">
                    {producto.stock_minimo}
                  </td>
                  <td className="px-5 py-3">
                    {producto.stock_bajo ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#C82333] whitespace-nowrap">
                        <AlertCircle
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Stock bajo</span>
                      </span>
                    ) : (
                      <span className="font-medium text-[#146C43] whitespace-nowrap">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
