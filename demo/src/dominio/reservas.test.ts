import { describe, expect, it } from "vitest";
import { relojDePrueba } from "@/__tests__/reloj-de-prueba";
import { generarGrilla, seSolapan, type Cita, type ConfigAgenda } from "./agenda";
import { reservarCita } from "./reservas";

const config: ConfigAgenda = { apertura: "08:00", cierre: "17:00", duracionMin: 30 };
const temprano = relojDePrueba({ hora: 7, minuto: 0 });
const MANANA = temprano.fecha(1);

const cita = (fecha: string, inicio: string, fin: string): Cita => ({
  id: `${fecha}T${inicio}`,
  nombre: "Persona de prueba",
  fecha,
  inicio,
  fin,
});

const pedir = (
  solicitud: Partial<{ nombre: string; fecha: string; inicio: string }>,
  citas: Cita[] = [],
  ahora = temprano.ahora,
) =>
  reservarCita({
    citas,
    solicitud: { nombre: "Ana", fecha: MANANA, inicio: "09:00", ...solicitud },
    config,
    ahora,
  });

describe("reservarCita (HU-03)", () => {
  it("HU-03.c1 · reserva un horario libre: devuelve la cita y la lista con ella agregada", () => {
    const previa = cita(MANANA, "08:00", "08:30");
    const r = pedir({ nombre: "  Ana  " }, [previa]);

    expect(r).toEqual({
      ok: true,
      cita: { id: `${MANANA}T09:00`, nombre: "Ana", fecha: MANANA, inicio: "09:00", fin: "09:30" },
      citas: [previa, { id: `${MANANA}T09:00`, nombre: "Ana", fecha: MANANA, inicio: "09:00", fin: "09:30" }],
    });
  });

  it("HU-03.c2 · rechaza un horario que se solapa con una cita existente", () => {
    expect(pedir({ inicio: "09:00" }, [cita(MANANA, "09:00", "09:30")])).toEqual({
      ok: false,
      error: "HORARIO_OCUPADO",
    });
    // Solapamiento parcial con una cita que no está alineada a la grilla.
    expect(pedir({ inicio: "08:30" }, [cita(MANANA, "08:15", "08:45")])).toEqual({
      ok: false,
      error: "HORARIO_OCUPADO",
    });
  });

  it("HU-03.c2 · control positivo: un horario contiguo a una cita sí se puede reservar", () => {
    expect(pedir({ inicio: "08:30" }, [cita(MANANA, "08:00", "08:30")]).ok).toBe(true);
    // Y una cita a la misma hora pero de otro día no estorba.
    expect(pedir({ inicio: "09:00" }, [cita(temprano.fecha(2), "09:00", "09:30")]).ok).toBe(true);
  });

  it("HU-03.c3 · rechaza un horario que ya empezó o una fecha pasada", () => {
    const nueveYDiez = relojDePrueba({ hora: 9, minuto: 10 });
    const hoy = nueveYDiez.fecha(0);
    expect(pedir({ fecha: hoy, inicio: "09:00" }, [], nueveYDiez.ahora)).toEqual({
      ok: false,
      error: "HORARIO_PASADO",
    });
    expect(pedir({ fecha: nueveYDiez.fecha(-1), inicio: "15:00" }, [], nueveYDiez.ahora)).toEqual({
      ok: false,
      error: "HORARIO_PASADO",
    });
    // Control positivo: el siguiente bloque del mismo día sí se puede.
    expect(pedir({ fecha: hoy, inicio: "09:30" }, [], nueveYDiez.ahora).ok).toBe(true);
  });

  it.each([
    ["vacío", ""],
    ["solo espacios", "   "],
    ["de 81 caracteres", "a".repeat(81)],
  ])("HU-03.c4 · rechaza un nombre %s", (_caso, nombre) => {
    expect(pedir({ nombre })).toEqual({ ok: false, error: "NOMBRE_INVALIDO" });
  });

  it("HU-03.c4 · borde: 80 caracteres es válido, y el nombre se valida antes que el horario", () => {
    expect(pedir({ nombre: "a".repeat(80) }).ok).toBe(true);
    expect(pedir({ nombre: "" }, [cita(MANANA, "09:00", "09:30")])).toEqual({
      ok: false,
      error: "NOMBRE_INVALIDO",
    });
  });

  it("HU-03.c4 · el tope de 80 se mide en caracteres visibles, no en unidades UTF-16 (VER-03, W3)", () => {
    // "Ana " (4) + 76 emojis = 80 caracteres visibles, aunque sean 156 unidades UTF-16.
    expect(pedir({ nombre: "Ana " + "🙂".repeat(76) }).ok).toBe(true);
    expect(pedir({ nombre: "e\u0301".repeat(80) }).ok).toBe(true); // «é» con acento combinado
    expect(pedir({ nombre: "Ana " + "🙂".repeat(77) })).toEqual({ ok: false, error: "NOMBRE_INVALIDO" });
    // Un emoji compuesto (con unidor ZWJ) cuenta como un carácter y no se toma por invisible.
    expect(pedir({ nombre: "Ana 👩‍👩‍👧" }).ok).toBe(true);
    // Debe haber al menos una letra o número.
    expect(pedir({ nombre: "🙂🙂" })).toEqual({ ok: false, error: "NOMBRE_INVALIDO" });
  });

  it.each([
    ["espacio de ancho cero", "\u200B"],
    ["carácter de control", "Ana\u0007"],
    ["nulo", "\u0000"],
    ["inversión de texto", "\u202Eana"],
  ])("HU-03.c4 · rechaza nombres con caracteres invisibles o de control (%s) (VER-03, I4)", (_caso, nombre) => {
    expect(pedir({ nombre })).toEqual({ ok: false, error: "NOMBRE_INVALIDO" });
  });

  it.each([
    ["fuera de la grilla", { inicio: "08:10" }],
    ["último bloque que no cabe", { inicio: "16:45" }],
    ["antes de la apertura", { inicio: "07:30" }],
    ["hora mal formada", { inicio: "25:00" }],
    ["sin horario elegido", { inicio: "" }],
    ["fecha inexistente", { fecha: "2030-02-30" }],
  ])("HU-03.c5 · rechaza un inicio que no está en la grilla (%s)", (_caso, cambio) => {
    expect(pedir(cambio)).toEqual({ ok: false, error: "HORARIO_INVALIDO" });
  });

  it("HU-03.c7 · no muta la lista recibida", () => {
    const citas = Object.freeze([cita(MANANA, "08:00", "08:30")]) as unknown as Cita[];
    const r = pedir({}, citas);
    expect(r.ok).toBe(true);
    expect(citas).toHaveLength(1);
  });

  it("HU-03.c7 · reservar uno tras otro todos los bloques nunca produce citas solapadas", () => {
    let citas: Cita[] = [];
    const grilla = generarGrilla(config);
    // Orden intercalado para no depender del orden natural.
    const orden = [...grilla.filter((_, i) => i % 2 === 1), ...grilla.filter((_, i) => i % 2 === 0)];
    for (const bloque of orden) {
      const r = pedir({ inicio: bloque.inicio }, citas);
      if (!r.ok) throw new Error(`No se pudo reservar ${bloque.inicio}: ${r.error}`);
      citas = r.citas;
    }
    expect(citas).toHaveLength(grilla.length);
    for (let i = 0; i < citas.length; i++) {
      for (let j = i + 1; j < citas.length; j++) {
        expect(seSolapan(citas[i], citas[j])).toBe(false);
      }
    }
    // Con el día lleno, cualquier nuevo intento choca.
    for (const bloque of grilla) {
      expect(pedir({ inicio: bloque.inicio }, citas)).toEqual({ ok: false, error: "HORARIO_OCUPADO" });
    }
  });
});
