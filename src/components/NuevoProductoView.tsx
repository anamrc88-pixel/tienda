import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ChevronDown, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Categoria } from '../types';

interface NuevoProductoViewProps {
  onCancelar: () => void;
  onGuardado: () => void;
}

interface ErroresFormulario {
  nombre?: string;
  categoriaId?: string;
  precio?: string;
  stockMinimo?: string;
}

export function NuevoProductoView({
  onCancelar,
  onGuardado,
}: NuevoProductoViewProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState<boolean>(true);
  const [errorCategorias, setErrorCategorias] = useState<string | null>(null);

  const [nombre, setNombre] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [precio, setPrecio] = useState<string>('');
  const [stockMinimo, setStockMinimo] = useState<string>('');

  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);

  useEffect(() => {
    let activo = true;

    async function cargarCategorias() {
      setCargandoCategorias(true);
      setErrorCategorias(null);

      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nombre')
          .order('nombre', { ascending: true });

        if (!activo) return;

        if (error) {
          setErrorCategorias(error.message);
          return;
        }

        setCategorias((data as Categoria[]) ?? []);
      } catch (err) {
        if (!activo) return;
        setErrorCategorias(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las categorías.'
        );
      } finally {
        if (activo) {
          setCargandoCategorias(false);
        }
      }
    }

    void cargarCategorias();

    return () => {
      activo = false;
    };
  }, []);

  const validar = (): {
    valido: boolean;
    precioEntero: number;
    stockMinimoEntero: number;
  } => {
    const nuevosErrores: ErroresFormulario = {};

    if (nombre.trim() === '') {
      nuevosErrores.nombre = 'Escribe el nombre del producto.';
    }

    if (categoriaId === '') {
      nuevosErrores.categoriaId = 'Elige una categoría de la lista.';
    }

    const precioLimpio = precio.trim().replace(/\./g, '');
    let precioEntero = 0;
    if (precioLimpio === '') {
      nuevosErrores.precio = 'Escribe el precio de venta.';
    } else if (!/^\d+$/.test(precioLimpio)) {
      nuevosErrores.precio =
        'Ingresa un precio entero en pesos, sin signos ni decimales.';
    } else {
      precioEntero = Number.parseInt(precioLimpio, 10);
      if (precioEntero <= 0) {
        nuevosErrores.precio = 'El precio debe ser mayor que 0.';
      }
    }

    const stockMinimoLimpio = stockMinimo.trim();
    let stockMinimoEntero = 0;
    if (stockMinimoLimpio === '') {
      nuevosErrores.stockMinimo = 'Escribe el stock mínimo.';
    } else if (!/^\d+$/.test(stockMinimoLimpio)) {
      nuevosErrores.stockMinimo =
        'Ingresa un número entero igual o mayor que 0.';
    } else {
      stockMinimoEntero = Number.parseInt(stockMinimoLimpio, 10);
    }

    setErrores(nuevosErrores);
    return {
      valido: Object.keys(nuevosErrores).length === 0,
      precioEntero,
      stockMinimoEntero,
    };
  };

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    setErrorGuardar(null);

    const { valido, precioEntero, stockMinimoEntero } = validar();
    if (!valido) {
      return;
    }

    setGuardando(true);

    try {
      const { error } = await supabase.from('productos').insert({
        nombre: nombre.trim(),
        categoria_id: Number(categoriaId),
        precio: precioEntero,
        stock_actual: 0,
        stock_minimo: stockMinimoEntero,
      });

      if (error) {
        setErrorGuardar(error.message);
        return;
      }

      onGuardado();
    } catch (err) {
      setErrorGuardar(
        err instanceof Error
          ? err.message
          : 'Error inesperado al guardar el producto.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-labelledby="titulo-nuevo-producto" className="max-w-xl">
      <nav
        aria-label="Ruta actual"
        className="mb-2 flex items-center gap-2 text-sm text-[#5A6572]"
      >
        <button
          type="button"
          onClick={onCancelar}
          className="hover:text-[#16202A] hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
        >
          Inventario
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-[#16202A]">Nuevo producto</span>
      </nav>

      <h1
        id="titulo-nuevo-producto"
        className="mb-6 font-display text-2xl font-bold text-[#16202A] sm:text-3xl"
      >
        Nuevo producto
      </h1>

      {errorCategorias && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xs border border-[#C82333] bg-[#FDF2F2] p-4 text-sm text-[#C82333]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              No se pudieron cargar las categorías
            </p>
            <p className="mt-1 text-[#16202A]">{errorCategorias}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => void manejarEnvio(e)}
        noValidate
        className="rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] p-5 sm:p-6"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="campo-nombre"
              className="block text-sm font-semibold text-[#16202A]"
            >
              Nombre{' '}
              <span className="text-[#C82333]" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="campo-nombre"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errores.nombre) {
                  setErrores((prev) => ({ ...prev, nombre: undefined }));
                }
              }}
              placeholder="Ej. Aceite 1 L"
              required
              aria-required="true"
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? 'error-nombre' : undefined}
              className={`mt-1.5 min-h-[42px] w-full rounded-xs border bg-[#FFFFFF] px-3 py-2 text-sm text-[#16202A] placeholder:text-[#5A6572] focus-visible:outline-2 focus-visible:outline-offset-0 ${
                errores.nombre
                  ? 'border-[#C82333] focus-visible:outline-[#C82333]'
                  : 'border-[#D8DEE6] focus-visible:border-[#146C43] focus-visible:outline-[#146C43]'
              }`}
            />
            {errores.nombre && (
              <p id="error-nombre" className="mt-1.5 text-xs font-medium text-[#C82333]">
                {errores.nombre}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="campo-categoria"
              className="block text-sm font-semibold text-[#16202A]"
            >
              Categoría{' '}
              <span className="text-[#C82333]" aria-hidden="true">
                *
              </span>
            </label>
            <div className="relative mt-1.5">
              <select
                id="campo-categoria"
                value={categoriaId}
                onChange={(e) => {
                  setCategoriaId(e.target.value);
                  if (errores.categoriaId) {
                    setErrores((prev) => ({
                      ...prev,
                      categoriaId: undefined,
                    }));
                  }
                }}
                disabled={cargandoCategorias}
                required
                aria-required="true"
                aria-invalid={Boolean(errores.categoriaId)}
                aria-describedby={
                  errores.categoriaId ? 'error-categoria' : undefined
                }
                className={`min-h-[42px] w-full appearance-none rounded-xs border bg-[#FFFFFF] py-2 pr-9 pl-3 text-sm text-[#16202A] cursor-pointer disabled:bg-[#F7F8FA] disabled:text-[#5A6572] focus-visible:outline-2 focus-visible:outline-offset-0 ${
                  errores.categoriaId
                    ? 'border-[#C82333] focus-visible:outline-[#C82333]'
                    : 'border-[#D8DEE6] focus-visible:border-[#146C43] focus-visible:outline-[#146C43]'
                }`}
              >
                <option value="">
                  {cargandoCategorias
                    ? 'Cargando categorías...'
                    : 'Selecciona una categoría'}
                </option>
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
            {errores.categoriaId && (
              <p
                id="error-categoria"
                className="mt-1.5 text-xs font-medium text-[#C82333]"
              >
                {errores.categoriaId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="campo-precio"
                className="block text-sm font-semibold text-[#16202A]"
              >
                Precio de venta{' '}
                <span className="text-[#C82333]" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative mt-1.5">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-[#5A6572]"
                >
                  $
                </span>
                <input
                  id="campo-precio"
                  type="text"
                  inputMode="numeric"
                  value={precio}
                  onChange={(e) => {
                    setPrecio(e.target.value);
                    if (errores.precio) {
                      setErrores((prev) => ({ ...prev, precio: undefined }));
                    }
                  }}
                  placeholder="12500"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errores.precio)}
                  aria-describedby={errores.precio ? 'error-precio' : undefined}
                  className={`min-h-[42px] w-full rounded-xs border bg-[#FFFFFF] py-2 pr-3 pl-7 text-sm text-[#16202A] tabular-nums placeholder:text-[#5A6572] focus-visible:outline-2 focus-visible:outline-offset-0 ${
                    errores.precio
                      ? 'border-[#C82333] focus-visible:outline-[#C82333]'
                      : 'border-[#D8DEE6] focus-visible:border-[#146C43] focus-visible:outline-[#146C43]'
                  }`}
                />
              </div>
              {errores.precio && (
                <p
                  id="error-precio"
                  className="mt-1.5 text-xs font-medium text-[#C82333]"
                >
                  {errores.precio}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="campo-stock-minimo"
                className="block text-sm font-semibold text-[#16202A]"
              >
                Stock mínimo{' '}
                <span className="text-[#C82333]" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="campo-stock-minimo"
                type="text"
                inputMode="numeric"
                value={stockMinimo}
                onChange={(e) => {
                  setStockMinimo(e.target.value);
                  if (errores.stockMinimo) {
                    setErrores((prev) => ({
                      ...prev,
                      stockMinimo: undefined,
                    }));
                  }
                }}
                placeholder="4"
                required
                aria-required="true"
                aria-invalid={Boolean(errores.stockMinimo)}
                aria-describedby={
                  errores.stockMinimo ? 'error-stock-minimo' : 'ayuda-stock-minimo'
                }
                className={`mt-1.5 min-h-[42px] w-full rounded-xs border bg-[#FFFFFF] px-3 py-2 text-sm text-[#16202A] tabular-nums placeholder:text-[#5A6572] focus-visible:outline-2 focus-visible:outline-offset-0 ${
                  errores.stockMinimo
                    ? 'border-[#C82333] focus-visible:outline-[#C82333]'
                    : 'border-[#D8DEE6] focus-visible:border-[#146C43] focus-visible:outline-[#146C43]'
                }`}
              />
              {errores.stockMinimo ? (
                <p
                  id="error-stock-minimo"
                  className="mt-1.5 text-xs font-medium text-[#C82333]"
                >
                  {errores.stockMinimo}
                </p>
              ) : (
                <p
                  id="ayuda-stock-minimo"
                  className="mt-1.5 text-xs text-[#5A6572]"
                >
                  Cuando el stock iguale o baje de este número saldrá la alerta.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xs border border-[#D8DEE6] bg-[#F7F8FA] px-4 py-3 text-sm text-[#16202A]">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-[#146C43]"
              aria-hidden="true"
            />
            <p className="leading-relaxed">
              El producto empieza con stock 0. El stock solo cambia cuando
              registras una entrada o una salida.
            </p>
          </div>

          {errorGuardar && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xs border border-[#C82333] bg-[#FDF2F2] p-4 text-sm text-[#C82333]"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold">No se pudo guardar el producto</p>
                <p className="mt-1 text-[#16202A]">{errorGuardar}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#D8DEE6] pt-5">
            <button
              type="button"
              onClick={onCancelar}
              disabled={guardando}
              className="min-h-[40px] rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#16202A] transition-colors duration-150 hover:border-[#16202A] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="min-h-[40px] rounded-xs bg-[#146C43] px-5 py-2 text-sm font-semibold text-[#FFFFFF] transition-colors duration-150 hover:bg-[#105736] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
            >
              {guardando ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
