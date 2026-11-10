/** Único punto de la app que lee el reloj del sistema. En pruebas se inyecta otro reloj. */
export const relojDelSistema = (): Date => new Date();
