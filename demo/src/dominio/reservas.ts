import {
  esFechaValida,
  esNombreValido,
  generarGrilla,
  seSolapan,
  yaEmpezo,
  type Cita,
  type ConfigAgenda,
  type FechaISO,
  type Hora,
} from "./agenda";

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

/**
 * Regla de reserva. Orden de validación: nombre → horario en la grilla → ya empezó → ocupado.
 * No muta `citas`: devuelve una lista nueva con la cita agregada.
 */
export function reservarCita({
  citas,
  solicitud,
  config,
  ahora,
}: {
  citas: readonly Cita[];
  solicitud: SolicitudReserva;
  config: ConfigAgenda;
  ahora: Date;
}): ResultadoReserva {
  if (!esNombreValido(solicitud.nombre)) return { ok: false, error: "NOMBRE_INVALIDO" };
  const nombre = solicitud.nombre.trim();

  const { fecha, inicio } = solicitud;
  const bloque = esFechaValida(fecha) ? generarGrilla(config).find((b) => b.inicio === inicio) : undefined;
  if (!bloque) return { ok: false, error: "HORARIO_INVALIDO" };

  if (yaEmpezo(fecha, bloque, ahora)) return { ok: false, error: "HORARIO_PASADO" };

  if (citas.some((c) => c.fecha === fecha && seSolapan(bloque, c))) {
    return { ok: false, error: "HORARIO_OCUPADO" };
  }

  const cita: Cita = { id: `${fecha}T${bloque.inicio}`, nombre, fecha, inicio: bloque.inicio, fin: bloque.fin };
  return { ok: true, cita, citas: [...citas, cita] };
}
