import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { relojDePrueba } from "@/__tests__/reloj-de-prueba";
import { CLAVE_CITAS } from "@/lib/repositorio-citas";
import { Agenda } from "./Agenda";

const temprano = relojDePrueba({ hora: 7, minuto: 0 });
const HOY = temprano.fecha(0);

const guardar = (valor: unknown) =>
  window.localStorage.setItem(CLAVE_CITAS, typeof valor === "string" ? valor : JSON.stringify(valor));

const cita = (fecha: string, inicio: string, fin: string) => ({
  id: `${fecha}T${inicio}`,
  nombre: "Persona de prueba",
  fecha,
  inicio,
  fin,
});

/** Fila de la lista para un bloque, buscada por su rango horario. */
const fila = (rango: string) => {
  const lista = screen.getByRole("list", { name: /horarios/i });
  const item = within(lista)
    .getAllByRole("listitem")
    .find((li) => li.textContent?.includes(rango));
  if (!item) throw new Error(`No hay fila para ${rango}`);
  return item;
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("Agenda (HU-02)", () => {
  it("HU-02.c1 · al abrir muestra la fecha del reloj y cada bloque con su estado en texto", () => {
    guardar([cita(HOY, "08:00", "08:30")]);
    render(<Agenda reloj={temprano.reloj} />);

    expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe(HOY);
    expect(within(screen.getByRole("list", { name: /horarios/i })).getAllByRole("listitem")).toHaveLength(18);
    expect(fila("08:00 – 08:30").textContent).toContain("Ocupado");
    expect(fila("08:30 – 09:00").textContent).toContain("Libre");
    // Privacidad: el bloque ocupado no expone el nombre.
    expect(fila("08:00 – 08:30").textContent).not.toContain("Persona de prueba");
  });

  it("HU-02.c2 · al cambiar la fecha muestra los bloques de ese día", () => {
    guardar([cita(HOY, "08:00", "08:30")]);
    render(<Agenda reloj={temprano.reloj} />);

    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: temprano.fecha(1) } });

    expect(fila("08:00 – 08:30").textContent).toContain("Libre");
  });

  it("HU-02.c3 · mientras no se leen las citas (render en servidor) muestra «Cargando agenda…»", () => {
    const html = renderToString(<Agenda reloj={temprano.reloj} />);
    expect(html).toContain("Cargando agenda…");
    expect(html).toContain('role="status"');
    expect(html).not.toContain("Libre");
  });

  it("HU-02.c4 · fecha pasada: muestra el estado vacío", () => {
    render(<Agenda reloj={temprano.reloj} />);
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: temprano.fecha(-1) } });
    expect(screen.getByText("No quedan horarios libres para esta fecha.")).toBeTruthy();
  });

  it("HU-02.c4 · día completamente ocupado: muestra el estado vacío", () => {
    const todos = Array.from({ length: 18 }, (_, i) => {
      const desde = 8 * 60 + i * 30;
      const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      return cita(HOY, hhmm(desde), hhmm(desde + 30));
    });
    guardar(todos);
    render(<Agenda reloj={temprano.reloj} />);
    expect(screen.getByText("No quedan horarios libres para esta fecha.")).toBeTruthy();
  });

  it("HU-02.c4 · control positivo: un día con huecos NO muestra el estado vacío", () => {
    render(<Agenda reloj={temprano.reloj} />);
    expect(screen.queryByText("No quedan horarios libres para esta fecha.")).toBeNull();
  });

  it("HU-02.c5 · datos guardados corruptos: alerta con Reintentar y recuperación sin recargar", () => {
    guardar("{no es json");
    render(<Agenda reloj={temprano.reloj} />);

    expect(screen.getByRole("alert").textContent).toContain("No pudimos leer las citas guardadas");
    expect(screen.queryByRole("list", { name: /horarios/i })).toBeNull();

    guardar([]); // algo externo repara el almacenamiento, sin evento
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(fila("08:00 – 08:30").textContent).toContain("Libre");
  });

  it("HU-02.c6 · el campo de fecha tiene label asociado y el estado no depende solo del color", () => {
    guardar([cita(HOY, "09:00", "09:30")]);
    render(<Agenda reloj={temprano.reloj} />);

    expect(screen.getByLabelText("Fecha").getAttribute("type")).toBe("date");
    const estados = within(screen.getByRole("list", { name: /horarios/i }))
      .getAllByRole("listitem")
      .map((li) => (li.textContent?.includes("Ocupado") ? "Ocupado" : li.textContent?.includes("Libre") ? "Libre" : "?"));
    expect(estados).not.toContain("?");
    expect(estados.filter((e) => e === "Ocupado")).toHaveLength(1);
  });
});
