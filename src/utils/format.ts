export function formatearPrecio(precio: number): string {
  const entero = Math.round(precio);
  const signo = entero < 0 ? '-' : '';
  const digitos = Math.abs(entero)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${signo}$${digitos}`;
}

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
