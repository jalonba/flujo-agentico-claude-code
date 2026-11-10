import { describe, expect, it } from "vitest";
import { ErrorAlmacenamiento, interpretarCitas } from "./repositorio-citas";

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
  ])("HU-02.c5 · datos guardados corruptos (%s): lanza ErrorAlmacenamiento", (_caso, crudo) => {
    expect(() => interpretarCitas(crudo)).toThrow(ErrorAlmacenamiento);
  });
});
