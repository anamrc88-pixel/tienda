# Tienda La Esquina

Aplicación web para llevar el inventario de una tienda de barrio a partir de las entradas y salidas de mercancía, con alertas automáticas cuando un producto llega a su stock mínimo.

Está construida como aplicación de cliente con React, Vite, TypeScript y Tailwind CSS, conectada a Supabase mediante `@supabase/supabase-js`.

## Ventanas de la aplicación

1. **Inventario (`V1`)**: muestra el resumen general (total de productos, productos con stock bajo y movimientos registrados), un buscador por nombre, un filtro por categoría y la tabla de productos desde `vista_productos` con precios en pesos colombianos (`$12.500`) y la etiqueta «Stock bajo» cuando `stock_actual <= stock_minimo`.
2. **Nuevo producto (`V2`)**: formulario con nombre, categoría, precio de venta y stock mínimo obligatorios. No permite escribir el stock inicial manualmente: todo producto nuevo se crea con `stock_actual = 0` y al guardar vuelve a Inventario con los datos actualizados.
3. **Movimientos (`V3`)**: permite registrar entradas o salidas de un producto (mostrando su stock actual), cantidad entera mayor que 0 y una nota opcional, junto con el historial ordenado del más reciente al más antiguo. La base de datos actualiza el stock automáticamente y rechaza salidas mayores al stock disponible.

## Variables de entorno

Crea un archivo `.env` en la raíz (puedes partir de `.env.example`) con estas dos variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

- `VITE_SUPABASE_URL`: URL del proyecto en Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: llave pública (`publishable key`) del proyecto en Supabase.

Si no defines estas variables, `src/config.ts` usa los valores de respaldo configurados para el proyecto.

## Cómo ejecutarla en local

1. Instala las dependencias:

```bash
npm install
```

2. Inicia el servidor de desarrollo:

```bash
npm run dev
```

3. Para generar la compilación de producción (por ejemplo, para desplegar en Vercel):

```bash
npm run build
```
