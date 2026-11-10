import type { Cita, ConfigAgenda, FechaISO, Hora } from "./agenda";

export type CodigoErrorReserva =
  | "NOMBRE_INVALIDO"
  | "HORARIO_INVALIDO"
  | "HORARIO_PASADO"
  | "HORARIO_OCUPADO";

export type ResultadoReserva =
  | { ok: true; cita: Cita; citas: Cita[] }
  | { ok: false; error: CodigoErrorReserva };

export interface SolicitudReserva {
  nombre: string;
  fecha: FechaISO;
  inicio: Hora;
}

export function reservarCita(entrada: {
  citas: readonly Cita[];
  solicitud: SolicitudReserva;
  config: ConfigAgenda;
  ahora: Date;
}): ResultadoReserva {
  void entrada;
  throw new Error("No implementado");
}
