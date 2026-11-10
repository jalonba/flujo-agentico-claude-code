import type { Cita } from "@/dominio/agenda";

export const CLAVE_CITAS = "agenda-citas:v1";

export class ErrorAlmacenamiento extends Error {}

export function interpretarCitas(crudo: string | null): Cita[] {
  void crudo;
  throw new Error("No implementado");
}
