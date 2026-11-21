import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type {
  MovimientoHistorial,
  ProductoVista,
  TipoMovimiento,
} from '../types';
import { formatearFechaMovimiento } from '../utils/format';

interface MovimientosViewProps {
  onMovimientoRegistrado: () => void;
}

interface ErroresFormulario {
  productoId?: string;
  cantidad?: string;
}

function obtenerNombreProducto(
  movimiento: MovimientoHistorial,
  mapaProductos: Map<number, string>
): string {
  if (movimiento.productos) {
    if (Array.isArray(movimiento.productos)) {
      const primero = movimiento.productos[0];
      if (primero?.nombre) return primero.nombre;
    } else if (movimiento.productos.nombre) {
      return movimiento.productos.nombre;
    }
  }
  return mapaProductos.get(movimiento.producto_id) ?? `Producto #${movimiento.producto_id}`;
}

export function MovimientosView({
  onMovimientoRegistrado,
}: MovimientosViewProps) {
  const [productos, setProductos] = useState<ProductoVista[]>([]);
  const [historial, setHistorial] = useState<MovimientoHistorial[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [productoId, setProductoId] = useState<string>('');
  const [tipo, setTipo] = useState<TipoMovimiento>('entrada');
  const [cantidad, setCantidad] = useState<string>('');
  const [nota, setNota] = useState<string>('');

  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<boolean>(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);

    try {
      const [resProductos, resMovimientos] = await Promise.all([
        supabase
          .from('vista_productos')
          .select(
            'id, nombre, categoria, categoria_id, precio, stock_actual, stock_minimo, stock_bajo'
          )
          .order('nombre', { ascending: true }),
        supabase
          .from('movimientos')
          .select(
            'id, producto_id, tipo, cantidad, nota, creado_en, productos(nombre)'
          )
          .order('creado_en', { ascending: false })
          .order('id', { ascending: false }),
      ]);

      const primerError = resProductos.error ?? resMovimientos.error;
      if (primerError) {
        setErrorCarga(primerError.message);
        return;
      }

      setProductos((resProductos.data as ProductoVista[]) ?? []);
      setHistorial((resMovimientos.data as MovimientoHistorial[]) ?? []);
    } catch (err) {
      setErrorCarga(
        err instanceof Error
          ? err.message
          : 'Error inesperado al cargar los movimientos.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const mapaProductos = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const producto of productos) {
      mapa.set(producto.id, producto.nombre);
    }
    return mapa;
  }, [productos]);

  const validar = (): { valido: boolean; cantidadEntera: number } => {
    const nuevosErrores: ErroresFormulario = {};

    if (productoId === '') {
      nuevosErrores.productoId = 'Elige un producto de la lista.';
    }

    const cantidadLimpia = cantidad.trim();
    let cantidadEntera = 0;
    if (cantidadLimpia === '') {
      nuevosErrores.cantidad = 'Escribe la cantidad.';
    } else if (!/^\d+$/.test(cantidadLimpia)) {
      nuevosErrores.cantidad = 'Ingresa un número entero mayor que 0.';
    } else {
      cantidadEntera = Number.parseInt(cantidadLimpia, 10);
      if (cantidadEntera <= 0) {
        nuevosErrores.cantidad = 'La cantidad debe ser mayor que 0.';
      }
    }

    setErrores(nuevosErrores);
    return {
      valido: Object.keys(nuevosErrores).length === 0,
      cantidadEntera,
    };
  };

  const manejarRegistro = async (e: FormEvent) => {
    e.preventDefault();
    setErrorRegistro(null);
    setMensajeExito(null);

    const { valido, cantidadEntera } = validar();
    if (!valido) {
      return;
    }

    setRegistrando(true);

    try {
      const { error } = await supabase.from('movimientos').insert({
        producto_id: Number(productoId),
        tipo,
        cantidad: cantidadEntera,
        nota: nota.trim() === '' ? null : nota.trim(),
      });

      if (error) {
        setErrorRegistro(error.message);
        return;
      }

      setProductoId('');
      setTipo('entrada');
      setCantidad('');
      setNota('');
      setErrores({});
      setMensajeExito('Movimiento registrado y stock actualizado.');

      await cargarDatos();
      onMovimientoRegistrado();
    } catch (err) {
      setErrorRegistro(
        err instanceof Error
          ? err.message
          : 'Error inesperado al registrar el movimiento.'
      );
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <section aria-labelledby="titulo-movimientos">
      <div className="mb-6">
        <h1
          id="titulo-movimientos"
          className="font-display text-2xl font-bold text-[#16202A] sm:text-3xl"
        >
          Registrar movimiento
        </h1>
        <p className="mt-1 max-w-[65ch] text-sm text-[#5A6572]">
          Una entrada suma al stock; una salida resta.
        </p>
      </div>

      {errorCarga && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xs border border-[#C82333] bg-[#FDF2F2] p-4 text-sm text-[#C82333]"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">
                No se pudieron cargar los movimientos desde Supabase
              </p>
              <p className="mt-1 text-[#16202A]">{errorCarga}</p>
              <p className="mt-1 text-xs text-[#16202A]">
                Verifica tu conexión a internet o los permisos de lectura y
                vuelve a intentar la carga.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void cargarDatos()}
            className="min-h-[40px] rounded-xs border border-[#C82333] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#C82333] transition-colors duration-150 hover:bg-[#FDF2F2] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C82333]"
          >
            Reintentar carga
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
        <div>
          <form
            onSubmit={(e) => void manejarRegistro(e)}
            noValidate
            className="rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] p-5 sm:p-6"
          >
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="campo-producto"
                  className="block text-sm font-semibold text-[#16202A]"
                >
                  Producto{' '}
                  <span className="text-[#C82333]" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="campo-producto"
                    value={productoId}
                    onChange={(e) => {
                      setProductoId(e.target.value);
                      setErrorRegistro(null);
                      setMensajeExito(null);
                      if (errores.productoId) {
                        setErrores((prev) => ({
                          ...prev,
                          productoId: undefined,
                        }));
                      }
                    }}
                    disabled={cargando || registrando}
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errores.productoId)}
                    aria-describedby={
                      errores.productoId ? 'error-producto' : undefined
                    }
                    className={`min-h-[42px] w-full appearance-none rounded-xs border bg-[#FFFFFF] py-2 pr-9 pl-3 text-sm text-[#16202A] cursor-pointer disabled:bg-[#F7F8FA] disabled:text-[#5A6572] focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      errores.productoId
                        ? 'border-[#C82333] focus-visible:outline-[#C82333]'
                        : 'border-[#D8DEE6] focus-visible:border-[#146C43] focus-visible:outline-[#146C43]'
                    }`}
                  >
                    <option value="">
                      {cargando
                        ? 'Cargando productos...'
                        : 'Selecciona un producto'}
                    </option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={String(producto.id)}>
                        {producto.nombre} (stock: {producto.stock_actual})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#5A6572]"
                    aria-hidden="true"
                  />
                </div>
                {errores.productoId && (
                  <p
                    id="error-producto"
                    className="mt-1.5 text-xs font-medium text-[#C82333]"
                  >
                    {errores.productoId}
                  </p>
                )}
              </div>

              <div>
                <span className="block text-sm font-semibold text-[#16202A]">
                  Tipo{' '}
                  <span className="text-[#C82333]" aria-hidden="true">
                    *
                  </span>
                </span>
                <div
                  role="group"
                  aria-label="Tipo de movimiento"
                  className="mt-1.5 grid grid-cols-2 gap-1 rounded-xs border border-[#D8DEE6] bg-[#F7F8FA] p-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTipo('entrada');
                      setErrorRegistro(null);
                    }}
                    aria-pressed={tipo === 'entrada'}
                    className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xs px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#146C43] ${
                      tipo === 'entrada'
                        ? 'border border-[#146C43] bg-[#FFFFFF] text-[#146C43]'
                        : 'border border-transparent text-[#5A6572] hover:text-[#16202A]'
                    }`}
                  >
                    <ArrowDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Entrada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipo('salida');
                      setErrorRegistro(null);
                    }}
                    aria-pressed={tipo === 'salida'}
                    className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xs px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#146C43] ${
                      tipo === 'salida'
                        ? 'border border-[#16202A] bg-[#FFFFFF] text-[#16202A]'
                        : 'border border-transparent text-[#5A6572] hover:text-[#16202A]'
                    }`}
                  >
                    <ArrowUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Salida</span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="campo-cantidad"
                  className="block text-sm font-semibold text-[#16202A]"
                >
                  Cantidad{' '}
                  <span className="text-[#C82333]" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="campo-cantidad"
                  type="text"
                  inputMode="numeric"
                  value={cantidad}
                  onChange={(e) => {
                    setCantidad(e.target.value);
                    setErrorRegistro(null);
                    setMensajeExito(null);
                    if (errores.cantidad) {
                      setErrores((prev) => ({ ...prev, cantidad: undefined }));
                    }
                  }}
                  placeholder="Ej. 6"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errores.cantidad)}
                  aria-describedby={
                    errores.cantidad ? 'error-cantidad' : undefined
                  }
                  className={`mt-1.5 min-h-[42px] w-full rounded-xs border bg-[#FFFFFF] px-3 py-2 text-sm text-[#16202A] tabular-nums placeholder:text-[#5A6572] focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    errores.cantidad
                      ? 'border-[#C82333] focus-visible:outline-[#C82333]'
                      : 'border-[#D8DEE6] focus-visible:border-[#146C43] focus-visible:outline-[#146C43]'
                  }`}
                />
                {errores.cantidad && (
                  <p
                    id="error-cantidad"
                    className="mt-1.5 text-xs font-medium text-[#C82333]"
                  >
                    {errores.cantidad}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="campo-nota"
                  className="block text-sm font-semibold text-[#16202A]"
                >
                  Nota{' '}
                  <span className="text-xs font-normal text-[#5A6572]">
                    (opcional)
                  </span>
                </label>
                <input
                  id="campo-nota"
                  type="text"
                  value={nota}
                  onChange={(e) => {
                    setNota(e.target.value);
                    setMensajeExito(null);
                  }}
                  placeholder={
                    tipo === 'entrada'
                      ? 'Ej. Pedido al proveedor'
                      : 'Ej. Ventas del día'
                  }
                  className="mt-1.5 min-h-[42px] w-full rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] px-3 py-2 text-sm text-[#16202A] placeholder:text-[#5A6572] focus-visible:border-[#146C43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
                />
              </div>

              <div className="flex justify-end border-t border-[#D8DEE6] pt-4">
                <button
                  type="submit"
                  disabled={registrando || cargando}
                  className="min-h-[40px] rounded-xs bg-[#146C43] px-5 py-2 text-sm font-semibold text-[#FFFFFF] transition-colors duration-150 hover:bg-[#105736] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
                >
                  {registrando ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </div>
          </form>

          {errorRegistro && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-xs border border-[#C82333] bg-[#FDF2F2] p-4 text-sm text-[#C82333]"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold leading-relaxed">{errorRegistro}</p>
                <p className="mt-1 text-xs text-[#16202A]">
                  Ajusta la cantidad o registra primero una entrada si falta
                  mercancía.
                </p>
              </div>
            </div>
          )}

          {mensajeExito && (
            <div
              role="status"
              className="mt-4 flex items-start gap-3 rounded-xs border border-[#146C43] bg-[#FFFFFF] p-4 text-sm text-[#146C43]"
            >
              <Check
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <p className="font-medium leading-relaxed">{mensajeExito}</p>
            </div>
          )}
        </div>

        <div className="rounded-xs border border-[#D8DEE6] bg-[#FFFFFF]">
          <div className="flex items-center justify-between border-b border-[#D8DEE6] px-5 py-4">
            <h2 className="font-display text-lg font-bold text-[#16202A]">
              Historial de movimientos
            </h2>
            {!cargando && !errorCarga && (
              <span className="text-xs font-medium text-[#5A6572] tabular-nums whitespace-nowrap">
                {historial.length}{' '}
                {historial.length === 1 ? 'registro' : 'registros'}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8DEE6] bg-[#F7F8FA] text-[#5A6572]">
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tipo
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-semibold"
                  >
                    Cant.
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Nota
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#D8DEE6]">
                {cargando ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="px-5 py-3.5">
                        <div className="h-4 w-20 rounded-xs bg-[#E8ECF1]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-4 w-32 rounded-xs bg-[#E8ECF1]" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-4 w-16 rounded-xs bg-[#E8ECF1]" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="ml-auto h-4 w-8 rounded-xs bg-[#E8ECF1]" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="h-4 w-28 rounded-xs bg-[#E8ECF1]" />
                      </td>
                    </tr>
                  ))
                ) : errorCarga ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-[#5A6572]"
                    >
                      No se puede mostrar el historial hasta resolver el error
                      de conexión.
                    </td>
                  </tr>
                ) : historial.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <p className="font-medium text-[#16202A]">
                        Todavía no hay movimientos registrados.
                      </p>
                      <p className="mt-1 text-sm text-[#5A6572]">
                        Usa el formulario de la izquierda para registrar la
                        primera entrada o salida.
                      </p>
                    </td>
                  </tr>
                ) : (
                  historial.map((mov) => (
                    <tr key={mov.id} className="bg-[#FFFFFF]">
                      <td className="px-5 py-3 text-[#5A6572] tabular-nums whitespace-nowrap">
                        {formatearFechaMovimiento(mov.creado_en)}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#16202A]">
                        {obtenerNombreProducto(mov, mapaProductos)}
                      </td>
                      <td className="px-4 py-3">
                        {mov.tipo === 'entrada' ? (
                          <span className="inline-flex items-center gap-1 font-medium text-[#146C43] whitespace-nowrap">
                            <ArrowDown
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>Entrada</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-[#16202A] whitespace-nowrap">
                            <ArrowUp
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>Salida</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#16202A] tabular-nums">
                        {mov.cantidad}
                      </td>
                      <td className="px-5 py-3 text-[#5A6572]">
                        {mov.nota && mov.nota.trim() !== '' ? mov.nota : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
