import { useState } from 'react';
import { InventarioView } from './components/InventarioView';
import { NuevoProductoView } from './components/NuevoProductoView';
import type { VistaActiva } from './types';

export default function App() {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('inventario');
  const [recargaInventario, setRecargaInventario] = useState<number>(0);

  const esSeccionInventario =
    vistaActiva === 'inventario' || vistaActiva === 'nuevo-producto';

  const volverAlInventario = (recargar: boolean) => {
    if (recargar) {
      setRecargaInventario((prev) => prev + 1);
    }
    setVistaActiva('inventario');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#16202A]">
      <header className="border-b border-[#D8DEE6] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-8 px-4 py-4 sm:px-8">
          <a
            href="#inventario"
            onClick={(e) => {
              e.preventDefault();
              setVistaActiva('inventario');
            }}
            className="font-display text-xl font-bold tracking-tight text-[#16202A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#146C43]"
          >
            Tienda La Esquina
          </a>

          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-6 sm:gap-8"
          >
            <button
              type="button"
              onClick={() => setVistaActiva('inventario')}
              aria-current={esSeccionInventario ? 'page' : undefined}
              className={`min-h-[40px] border-b-2 px-1 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#146C43] ${
                esSeccionInventario
                  ? 'border-[#146C43] text-[#146C43]'
                  : 'border-transparent text-[#5A6572] hover:text-[#16202A]'
              }`}
            >
              Inventario
            </button>

            <button
              type="button"
              onClick={() => setVistaActiva('movimientos')}
              aria-current={vistaActiva === 'movimientos' ? 'page' : undefined}
              className={`min-h-[40px] border-b-2 px-1 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#146C43] ${
                vistaActiva === 'movimientos'
                  ? 'border-[#146C43] text-[#146C43]'
                  : 'border-transparent text-[#5A6572] hover:text-[#16202A]'
              }`}
            >
              Movimientos
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-4 py-8 sm:px-8 sm:py-10">
        {vistaActiva === 'inventario' && (
          <InventarioView
            key={recargaInventario}
            onNuevoProducto={() => setVistaActiva('nuevo-producto')}
          />
        )}

        {vistaActiva === 'nuevo-producto' && (
          <NuevoProductoView
            onCancelar={() => volverAlInventario(false)}
            onGuardado={() => volverAlInventario(true)}
          />
        )}

        {vistaActiva === 'movimientos' && (
          <section aria-labelledby="titulo-movimientos" className="max-w-3xl">
            <div className="mb-6 border-b border-[#D8DEE6] pb-4">
              <h1
                id="titulo-movimientos"
                className="font-display text-2xl font-bold text-[#16202A] sm:text-3xl"
              >
                Movimientos
              </h1>
              <p className="mt-1 max-w-[65ch] text-sm text-[#5A6572]">
                Aquí irán el registro de entradas y salidas y el historial de la
                tienda en los próximos pasos.
              </p>
            </div>

            <div className="rounded-xs border border-[#D8DEE6] bg-[#FFFFFF] p-6">
              <p className="text-sm text-[#5A6572]">
                Esqueleto listo. Vuelve a Inventario para revisar las
                existencias de la tienda.
              </p>
              <button
                type="button"
                onClick={() => setVistaActiva('inventario')}
                className="mt-4 inline-flex min-h-[40px] items-center rounded-xs bg-[#146C43] px-4 py-2 text-sm font-semibold text-[#FFFFFF] transition-colors duration-150 hover:bg-[#105736] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
              >
                Ver inventario
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
