/** Hora del día en formato `HH:MM` (24 h). */
export type Hora = string;
/** Fecha en formato `YYYY-MM-DD`. */
export type FechaISO = string;

export interface Cita {
  id: string;
  nombre: string;
  fecha: FechaISO;
  inicio: Hora;
  fin: Hora;
}

export interface Bloque {
  inicio: Hora;
  fin: Hora;
}

export interface ConfigAgenda {
  apertura: Hora;
  cierre: Hora;
  duracionMin: number;
}

export interface EntradaHorarios extends ConfigAgenda {
  citas: readonly Cita[];
  fecha: FechaISO;
  /** Reloj inyectado: el dominio nunca lee el reloj del sistema. */
  ahora: Date;
}

export function calcularHorariosLibres(entrada: EntradaHorarios): Bloque[] {
  void entrada;
  throw new Error("No implementado");
}
