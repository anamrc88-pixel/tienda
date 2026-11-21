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

export function formatearFechaMovimiento(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) {
    return fechaIso;
  }

  const ahora = new Date();
  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );
  const inicioFecha = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate()
  );
  const diffDias = Math.round(
    (inicioHoy.getTime() - inicioFecha.getTime()) / 86_400_000
  );

  const hora = `${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, '0')}`;

  if (diffDias === 0) {
    return `Hoy ${hora}`;
  }
  if (diffDias === 1) {
    return `Ayer ${hora}`;
  }

  const meses = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()] ?? '';
  return `${dia} ${mes} ${hora}`;
}
