import { describe, expect, it } from "vitest";
import { CLAVE_CITAS, ErrorAlmacenamiento, guardarCitas, interpretarCitas, leerCitas } from "./repositorio-citas";

const citaValida = {
  id: "2030-01-16T08:00",
  nombre: "Persona de prueba",
  fecha: "2030-01-16",
  inicio: "08:00",
  fin: "08:30",
};

describe("interpretarCitas (HU-02)", () => {
  it("HU-02.c1 · sin nada guardado devuelve una lista vacía", () => {
    expect(interpretarCitas(null)).toEqual([]);
  });

  it("HU-02.c1 · devuelve las citas guardadas con forma válida", () => {
    expect(interpretarCitas(JSON.stringify([citaValida]))).toEqual([citaValida]);
  });

  it.each([
    ["JSON inválido", "{no es json"],
    ["no es una lista", JSON.stringify({ citas: [] })],
    ["elemento sin campos", JSON.stringify([{ id: 1 }])],
    ["hora mal formada", JSON.stringify([{ ...citaValida, inicio: "8:00" }])],
    ["fecha mal formada", JSON.stringify([{ ...citaValida, fecha: "16/01/2030" }])],
    ["nombre vacío", JSON.stringify([{ ...citaValida, nombre: "" }])],
    ["fin antes del inicio (VER-03, W1)", JSON.stringify([{ ...citaValida, inicio: "09:30", fin: "09:00" }])],
    ["duración cero (VER-03, W1)", JSON.stringify([{ ...citaValida, inicio: "09:00", fin: "09:00" }])],
    ["nombre de más de 80 caracteres", JSON.stringify([{ ...citaValida, nombre: "a".repeat(81) }])],
  ])("HU-02.c5 · datos guardados corruptos (%s): lanza ErrorAlmacenamiento", (_caso, crudo) => {
    expect(() => interpretarCitas(crudo)).toThrow(ErrorAlmacenamiento);
  });
});

describe("guardarCitas / leerCitas (HU-03)", () => {
  it("HU-03.c6 · lo guardado se lee igual después (persistencia en la clave versionada)", () => {
    const memoria = new Map<string, string>();
    const almacenamiento = {
      getItem: (k: string) => memoria.get(k) ?? null,
      setItem: (k: string, v: string) => void memoria.set(k, v),
    };
    guardarCitas(almacenamiento, [citaValida]);
    expect([...memoria.keys()]).toEqual([CLAVE_CITAS]);
    expect(leerCitas(almacenamiento)).toEqual([citaValida]);
  });
});
