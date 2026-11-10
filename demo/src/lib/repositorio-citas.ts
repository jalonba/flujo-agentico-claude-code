import { esCitaValida, type Cita } from "@/dominio/agenda";

export const CLAVE_CITAS = "agenda-citas:v1";

export class ErrorAlmacenamiento extends Error {
  constructor(motivo: string) {
    super(`No se pudieron leer las citas guardadas: ${motivo}`);
    this.name = "ErrorAlmacenamiento";
  }
}

/** Convierte lo guardado en `localStorage` en citas válidas, o lanza `ErrorAlmacenamiento`. */
export function interpretarCitas(crudo: string | null): Cita[] {
  if (crudo === null) return [];

  let datos: unknown;
  try {
    datos = JSON.parse(crudo);
  } catch {
    throw new ErrorAlmacenamiento("no es JSON válido");
  }
  if (!Array.isArray(datos)) throw new ErrorAlmacenamiento("no es una lista");
  if (!datos.every(esCitaValida)) throw new ErrorAlmacenamiento("hay citas con forma inválida");
  return datos;
}

export function leerCitas(almacenamiento: Pick<Storage, "getItem">): Cita[] {
  return interpretarCitas(almacenamiento.getItem(CLAVE_CITAS));
}

export function guardarCitas(almacenamiento: Pick<Storage, "setItem">, citas: Cita[]): void {
  almacenamiento.setItem(CLAVE_CITAS, JSON.stringify(citas));
}
