/**
 * Reloj inyectable para pruebas.
 *
 * Ninguna prueba lee el reloj del sistema: todas parten de este ancla fija y derivan de ella
 * las fechas que necesitan ("ayer", "mañana"). Así el resultado no depende del día en que corra la
 * suite. La guardia `guardia-reloj.test.ts` hace cumplir la regla.
 */
const ANCLA = { anio: 2030, mes: 1, dia: 15 } as const;

const dosDigitos = (n: number) => String(n).padStart(2, "0");

export function relojDePrueba({ hora, minuto }: { hora: number; minuto: number }) {
  const ahora = new Date(ANCLA.anio, ANCLA.mes - 1, ANCLA.dia, hora, minuto);

  /** Fecha `YYYY-MM-DD` desplazada `dias` respecto del día de `ahora` (0 = hoy). */
  const fecha = (dias: number): string => {
    const d = new Date(ANCLA.anio, ANCLA.mes - 1, ANCLA.dia + dias);
    return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
  };

  return { ahora, fecha, reloj: () => ahora };
}
