import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { relojDePrueba } from "@/__tests__/reloj-de-prueba";
import { CLAVE_CITAS } from "@/lib/repositorio-citas";
import { Agenda } from "./Agenda";

const temprano = relojDePrueba({ hora: 7, minuto: 0 });
const HOY = temprano.fecha(0);

const guardadas = () => JSON.parse(window.localStorage.getItem(CLAVE_CITAS) ?? "null");

const fila = (rango: string) => {
  const item = within(screen.getByRole("list", { name: /horarios/i }))
    .getAllByRole("listitem")
    .find((li) => li.textContent?.includes(rango));
  if (!item) throw new Error(`No hay fila para ${rango}`);
  return item;
};

async function reservar(nombre: string, horario: string) {
  const usuario = userEvent.setup();
  if (nombre) await usuario.type(screen.getByLabelText("Nombre"), nombre);
  await usuario.selectOptions(screen.getByLabelText("Horario"), horario);
  await usuario.click(screen.getByRole("button", { name: "Reservar" }));
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("Formulario de reserva (HU-03)", () => {
  it("HU-03.c1 · reserva un horario libre, confirma y marca el bloque como Ocupado", async () => {
    render(<Agenda reloj={temprano.reloj} />);
    await reservar("Ana", "09:00 – 09:30");

    expect(screen.getByRole("status").textContent).toMatch(/^Cita reservada: Ana, .+ a las 09:00\.$/);
    expect(fila("09:00 – 09:30").textContent).toContain("Ocupado");
    expect(guardadas()).toEqual([
      { id: `${HOY}T09:00`, nombre: "Ana", fecha: HOY, inicio: "09:00", fin: "09:30" },
    ]);
  });

  it("HU-03.c2 · si otra pestaña ocupó el horario después de pintar la lista, lo rechaza y no guarda", async () => {
    render(<Agenda reloj={temprano.reloj} />);
    // Otra pestaña guarda una cita a las 09:00 sin que esta se entere (sin evento).
    const ajena = { id: `${HOY}T09:00`, nombre: "Otra persona", fecha: HOY, inicio: "09:00", fin: "09:30" };
    window.localStorage.setItem(CLAVE_CITAS, JSON.stringify([ajena]));

    await reservar("Ana", "09:00 – 09:30");

    expect(screen.getByRole("alert").textContent).toBe("Ese horario acaba de ocuparse. Elige otro.");
    expect(guardadas()).toEqual([ajena]);
    expect(fila("09:00 – 09:30").textContent).toContain("Ocupado");
  });

  it("HU-03.c3 · si el horario empezó mientras se llenaba el formulario, lo rechaza y no guarda", async () => {
    let ahora = temprano.ahora;
    const ochoYCinco = relojDePrueba({ hora: 8, minuto: 5 }).ahora;
    render(<Agenda reloj={() => ahora} />);

    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText("Nombre"), "Ana");
    await usuario.selectOptions(screen.getByLabelText("Horario"), "08:00 – 08:30");
    ahora = ochoYCinco; // el reloj avanza antes de enviar
    await usuario.click(screen.getByRole("button", { name: "Reservar" }));

    expect(screen.getByRole("alert").textContent).toBe("Ese horario ya pasó. Elige uno más tarde.");
    expect(guardadas()).toBeNull();
  });

  it("HU-03.c4 · nombre en blanco: error asociado al campo y no guarda", async () => {
    render(<Agenda reloj={temprano.reloj} />);
    await reservar("   ", "09:00 – 09:30");

    const campo = screen.getByLabelText("Nombre");
    const alerta = screen.getByRole("alert");
    expect(alerta.textContent).toBe("Escribe el nombre de quien reserva (máximo 80 caracteres).");
    expect(campo.getAttribute("aria-invalid")).toBe("true");
    expect(campo.getAttribute("aria-describedby")).toBe(alerta.id);
    expect(guardadas()).toBeNull();
  });

  it("HU-03.c5 · sin horario elegido: pide elegir uno de la lista", async () => {
    render(<Agenda reloj={temprano.reloj} />);
    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText("Nombre"), "Ana");
    await usuario.click(screen.getByRole("button", { name: "Reservar" }));

    expect(screen.getByRole("alert").textContent).toBe("Elige un horario de la lista.");
    expect(guardadas()).toBeNull();
  });

  it("HU-03.c6 · al recargar, la cita sigue ahí y su bloque sigue Ocupado", async () => {
    const { unmount } = render(<Agenda reloj={temprano.reloj} />);
    await reservar("Ana", "10:00 – 10:30");
    unmount();

    render(<Agenda reloj={temprano.reloj} />); // "recarga": montaje nuevo leyendo localStorage
    expect(fila("10:00 – 10:30").textContent).toContain("Ocupado");
    expect(fila("10:30 – 11:00").textContent).toContain("Libre");
  });
});
