import { useMemo, useSyncExternalStore } from "react";
import type { Cita } from "@/dominio/agenda";
import { CLAVE_CITAS, interpretarCitas } from "./repositorio-citas";

/** En el servidor (y en el primer render de hidratación) todavía no hay `localStorage`. */
const PENDIENTE = Symbol("pendiente");
/** El navegador bloqueó el acceso a `localStorage`. */
const INACCESIBLE = Symbol("inaccesible");

type Crudo = string | null | typeof PENDIENTE | typeof INACCESIBLE;

export type LecturaCitas =
  | { estado: "cargando" }
  | { estado: "error" }
  | { estado: "lista"; citas: Cita[] };

const oyentes = new Set<() => void>();

/** Avisa a los componentes que vuelvan a leer `localStorage` (escrituras propias o "Reintentar"). */
export function notificarCambioDeCitas(): void {
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  window.addEventListener("storage", oyente); // cambios hechos desde otra pestaña
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", oyente);
  };
}

function leerCrudo(): Crudo {
  try {
    return window.localStorage.getItem(CLAVE_CITAS);
  } catch {
    return INACCESIBLE;
  }
}

export function useCitasGuardadas(): LecturaCitas {
  const crudo = useSyncExternalStore<Crudo>(suscribir, leerCrudo, () => PENDIENTE);

  return useMemo<LecturaCitas>(() => {
    if (crudo === PENDIENTE) return { estado: "cargando" };
    if (crudo === INACCESIBLE) return { estado: "error" };
    try {
      return { estado: "lista", citas: interpretarCitas(crudo) };
    } catch {
      return { estado: "error" };
    }
  }, [crudo]);
}
