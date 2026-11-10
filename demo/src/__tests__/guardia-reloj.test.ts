import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guardia: ninguna prueba lee el reloj del sistema.
 * Lección 3 (docs/lecciones.md): una prueba con fecha literal relativa a "hoy" cambia de color sola.
 */
const PATRON_RELOJ_DEL_SISTEMA = /new\s+Date\(\s*\)|Date\.now\(/;

const RAIZ = join(__dirname, "..");

function archivosDePrueba(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) return archivosDePrueba(ruta);
    const esDePrueba = /\.test\.tsx?$/.test(entrada.name) || ruta.includes("__tests__");
    return esDePrueba && /\.tsx?$/.test(entrada.name) ? [ruta] : [];
  });
}

describe("guardia del reloj inyectado", () => {
  it("control positivo: el detector reconoce las dos formas de leer el reloj del sistema", () => {
    // Las muestras se arman por partes para que este archivo no se detecte a sí mismo.
    const muestras = ["const x = new " + "Date();", "const t = Date." + "now();"];
    for (const muestra of muestras) {
      expect(PATRON_RELOJ_DEL_SISTEMA.test(muestra)).toBe(true);
    }
    expect(PATRON_RELOJ_DEL_SISTEMA.test("new Date(2030, 0, 15)")).toBe(false);
  });

  it("ningún archivo de prueba usa el reloj del sistema", () => {
    const archivos = archivosDePrueba(RAIZ);
    // Sin esto, un recorrido vacío daría verde por ausencia.
    expect(archivos.length).toBeGreaterThanOrEqual(3);

    const infractores = archivos
      .filter((ruta) => PATRON_RELOJ_DEL_SISTEMA.test(readFileSync(ruta, "utf8")))
      .map((ruta) => relative(RAIZ, ruta));
    expect(infractores).toEqual([]);
  });
});
