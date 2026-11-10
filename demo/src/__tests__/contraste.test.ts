import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Gate de contraste WCAG AA sobre los tokens de color de `globals.css`.
 * Texto: ≥ 4,5:1. Indicador de foco (no texto): ≥ 3:1.
 */
const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

function token(nombre: string): string {
  const m = new RegExp(`--color-${nombre}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  if (!m) throw new Error(`Token --color-${nombre} no encontrado o no es #RRGGBB`);
  return m[1];
}

function luminancia(hex: string): number {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
}

function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

const PARES: [texto: string, fondo: string, minimo: number][] = [
  ["texto", "fondo", 4.5],
  ["texto-suave", "fondo", 4.5],
  ["libre-texto", "libre-fondo", 4.5],
  ["ocupado-texto", "ocupado-fondo", 4.5],
  ["error-texto", "error-fondo", 4.5],
  ["exito-texto", "exito-fondo", 4.5],
  ["acento-texto", "acento", 4.5],
  ["foco", "fondo", 3],
];

describe("contraste de los tokens de color (HU-02.c6)", () => {
  it("control positivo: la fórmula da 21 para negro/blanco y reprueba un gris claro", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contraste("#999999", "#ffffff")).toBeLessThan(4.5);
  });

  it.each(PARES)("HU-02.c6 · %s sobre %s cumple el mínimo", (texto, fondo, minimo) => {
    expect(contraste(token(texto), token(fondo))).toBeGreaterThanOrEqual(minimo);
  });
});
