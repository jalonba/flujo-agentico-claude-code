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

const RE_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const RE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

const dosDigitos = (n: number) => String(n).padStart(2, "0");

export function horaAMinutos(hora: Hora): number {
  const partes = RE_HORA.exec(hora);
  if (!partes) throw new RangeError(`Hora inválida: "${hora}" (se espera HH:MM)`);
  return Number(partes[1]) * 60 + Number(partes[2]);
}

export function minutosAHora(minutos: number): Hora {
  return `${dosDigitos(Math.floor(minutos / 60))}:${dosDigitos(minutos % 60)}`;
}

/** Instante local de `fecha` + `minutos` desde la medianoche. Valida que la fecha exista. */
export function instante(fecha: FechaISO, minutos = 0): Date {
  const partes = RE_FECHA.exec(fecha);
  if (!partes) throw new RangeError(`Fecha inválida: "${fecha}" (se espera YYYY-MM-DD)`);
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const d = new Date(anio, mes - 1, dia);
  if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    throw new RangeError(`Fecha inexistente: "${fecha}"`);
  }
  return new Date(anio, mes - 1, dia, 0, minutos);
}

/** Bloques consecutivos de `duracionMin` desde la apertura; el que no cabe antes del cierre se descarta. */
export function generarGrilla({ apertura, cierre, duracionMin }: ConfigAgenda): Bloque[] {
  const desde = horaAMinutos(apertura);
  const hasta = horaAMinutos(cierre);
  if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
    throw new RangeError(`Duración inválida: ${duracionMin} (se espera un entero mayor que 0)`);
  }
  if (desde >= hasta) throw new RangeError(`La apertura (${apertura}) debe ser antes del cierre (${cierre})`);

  const bloques: Bloque[] = [];
  for (let inicio = desde; inicio + duracionMin <= hasta; inicio += duracionMin) {
    bloques.push({ inicio: minutosAHora(inicio), fin: minutosAHora(inicio + duracionMin) });
  }
  return bloques;
}

/** Dos intervalos se solapan si cada uno empieza antes de que termine el otro. Tocarse no cuenta. */
export function seSolapan(a: Bloque, b: Bloque): boolean {
  return horaAMinutos(a.inicio) < horaAMinutos(b.fin) && horaAMinutos(b.inicio) < horaAMinutos(a.fin);
}

export function yaEmpezo(fecha: FechaISO, bloque: Bloque, ahora: Date): boolean {
  return instante(fecha, horaAMinutos(bloque.inicio)).getTime() <= ahora.getTime();
}

export interface BloqueAgenda extends Bloque {
  estado: "libre" | "ocupado";
}

/** Bloques del día que aún no han empezado, cada uno marcado libre u ocupado. */
export function calcularAgendaDelDia(entrada: EntradaHorarios): BloqueAgenda[] {
  const { citas, fecha, ahora } = entrada;
  const grilla = generarGrilla(entrada);
  instante(fecha); // valida la fecha aunque la grilla quede vacía

  const citasDelDia = citas.filter((c) => c.fecha === fecha);
  return grilla
    .filter((bloque) => !yaEmpezo(fecha, bloque, ahora))
    .map((bloque) => ({
      ...bloque,
      estado: citasDelDia.some((c) => seSolapan(bloque, c)) ? "ocupado" : "libre",
    }));
}

export function calcularHorariosLibres(entrada: EntradaHorarios): Bloque[] {
  return calcularAgendaDelDia(entrada)
    .filter((b) => b.estado === "libre")
    .map(({ inicio, fin }) => ({ inicio, fin }));
}

/** `YYYY-MM-DD` del día local de `d`. */
export function fechaISO(d: Date): FechaISO {
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

export function esFechaValida(fecha: string): boolean {
  try {
    instante(fecha);
    return true;
  } catch {
    return false;
  }
}

/** Valida la forma de una cita leída de afuera (p. ej. del almacenamiento del navegador). */
export function esCitaValida(x: unknown): x is Cita {
  if (typeof x !== "object" || x === null) return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.nombre === "string" &&
    c.nombre.trim().length > 0 &&
    typeof c.fecha === "string" &&
    esFechaValida(c.fecha) &&
    typeof c.inicio === "string" &&
    RE_HORA.test(c.inicio) &&
    typeof c.fin === "string" &&
    RE_HORA.test(c.fin)
  );
}
