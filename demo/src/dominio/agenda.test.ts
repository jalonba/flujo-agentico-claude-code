import { describe, expect, it } from "vitest";
import { relojDePrueba } from "@/__tests__/reloj-de-prueba";
import { calcularAgendaDelDia, calcularHorariosLibres, type Bloque, type Cita } from "./agenda";

// "Hoy" es el día del reloj de prueba; a las 07:00 todavía no ha empezado ningún bloque.
const temprano = relojDePrueba({ hora: 7, minuto: 0 });
const MANANA = temprano.fecha(1);

const base = {
  apertura: "08:00",
  cierre: "10:00",
  duracionMin: 30,
  citas: [] as Cita[],
  fecha: MANANA,
  ahora: temprano.ahora,
};

const cita = (fecha: string, inicio: string, fin: string): Cita => ({
  id: `${fecha}T${inicio}`,
  nombre: "Persona de prueba",
  fecha,
  inicio,
  fin,
});

const inicios = (bloques: Bloque[]) => bloques.map((b) => b.inicio);

describe("calcularHorariosLibres (HU-01)", () => {
  it("HU-01.c1 · día sin citas: devuelve todos los bloques de la jornada, en orden", () => {
    expect(calcularHorariosLibres(base)).toEqual([
      { inicio: "08:00", fin: "08:30" },
      { inicio: "08:30", fin: "09:00" },
      { inicio: "09:00", fin: "09:30" },
      { inicio: "09:30", fin: "10:00" },
    ]);
  });

  it("HU-01.c2 · excluye los bloques que se solapan con una cita y no mira citas de otros días", () => {
    const citas = [cita(MANANA, "08:15", "08:45"), cita(temprano.fecha(2), "09:00", "09:30")];
    expect(inicios(calcularHorariosLibres({ ...base, citas }))).toEqual(["09:00", "09:30"]);
  });

  it("HU-01.c3 · citas en el borde de apertura y de cierre: tocarse no es solaparse", () => {
    const citas = [cita(MANANA, "08:00", "08:30"), cita(MANANA, "09:30", "10:00")];
    expect(inicios(calcularHorariosLibres({ ...base, citas }))).toEqual(["08:30", "09:00"]);
  });

  it("HU-01.c4 · no ofrece el bloque final que no cabe antes del cierre", () => {
    expect(inicios(calcularHorariosLibres({ ...base, cierre: "09:45" }))).toEqual([
      "08:00",
      "08:30",
      "09:00",
    ]);
  });

  it("HU-01.c5 · fecha en el pasado: no hay horarios libres", () => {
    expect(calcularHorariosLibres({ ...base, fecha: temprano.fecha(-1) })).toEqual([]);
  });

  it("HU-01.c6 · hoy: descarta los bloques que ya empezaron según el reloj inyectado", () => {
    const nueveYDiez = relojDePrueba({ hora: 9, minuto: 10 });
    const hoy = { ...base, fecha: nueveYDiez.fecha(0), ahora: nueveYDiez.ahora };
    expect(inicios(calcularHorariosLibres(hoy))).toEqual(["09:30"]);

    // Borde: a las 09:00 en punto el bloque de las 09:00 ya empezó.
    const nueveEnPunto = relojDePrueba({ hora: 9, minuto: 0 });
    expect(inicios(calcularHorariosLibres({ ...hoy, ahora: nueveEnPunto.ahora }))).toEqual(["09:30"]);
  });

  it.each([
    ["duración cero", { duracionMin: 0 }, /Duración inválida/],
    ["duración negativa", { duracionMin: -30 }, /Duración inválida/],
    ["duración no entera", { duracionMin: 12.5 }, /Duración inválida/],
    ["apertura después del cierre", { apertura: "10:00", cierre: "08:00" }, /antes del cierre/],
    ["apertura igual al cierre", { apertura: "08:00", cierre: "08:00" }, /antes del cierre/],
    ["hora sin cero inicial", { apertura: "8:00" }, /Hora inválida/],
    ["hora fuera de rango", { cierre: "24:00" }, /Hora inválida/],
    ["fecha inexistente", { fecha: "2030-02-30" }, /Fecha inexistente/],
    ["fecha mal formada", { fecha: "mañana" }, /Fecha inválida/],
  ])("HU-01.c7 · entrada inválida (%s): lanza RangeError por esa causa", (_caso, cambio, causa) => {
    // Se afirma también la causa: un RangeError lanzado por otro motivo no cuenta.
    const calcular = () => calcularHorariosLibres({ ...base, ...cambio });
    expect(calcular).toThrow(RangeError);
    expect(calcular).toThrow(causa);
  });
});

describe("calcularAgendaDelDia (HU-02)", () => {
  it("HU-02.c1 · marca cada bloque futuro como libre u ocupado y omite los que ya empezaron", () => {
    const nueveYDiez = relojDePrueba({ hora: 9, minuto: 10 });
    const hoy = nueveYDiez.fecha(0);
    const agenda = calcularAgendaDelDia({
      ...base,
      cierre: "11:00",
      fecha: hoy,
      ahora: nueveYDiez.ahora,
      citas: [cita(hoy, "10:00", "10:30"), cita(hoy, "08:00", "08:30")],
    });
    expect(agenda).toEqual([
      { inicio: "09:30", fin: "10:00", estado: "libre" },
      { inicio: "10:00", fin: "10:30", estado: "ocupado" },
      { inicio: "10:30", fin: "11:00", estado: "libre" },
    ]);
  });
});
