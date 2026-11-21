import { useState } from 'react';
import { InventarioView } from './components/InventarioView';
import { MovimientosView } from './components/MovimientosView';
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
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3.5 sm:px-8 sm:py-4">
          <a
            href="#inventario"
            onClick={(e) => {
              e.preventDefault();
              setVistaActiva('inventario');
            }}
            className="font-display text-lg font-bold tracking-tight text-[#16202A] sm:text-xl whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#146C43]"
          >
            Tienda La Esquina
          </a>

          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-4 sm:gap-8"
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
          <MovimientosView
            onMovimientoRegistrado={() =>
              setRecargaInventario((prev) => prev + 1)
            }
          />
        )}
      </main>
    </div>
  );
}
