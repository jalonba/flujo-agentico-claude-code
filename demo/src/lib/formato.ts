import { instante, type FechaISO } from "@/dominio/agenda";

const formatoFechaLarga = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** p. ej. «miércoles, 11 de noviembre de 2026». */
export function formatearFechaLarga(fecha: FechaISO): string {
  return formatoFechaLarga.format(instante(fecha));
}

/** Clases de foco visible compartidas por todos los controles. */
export const CLASES_FOCO =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco";
