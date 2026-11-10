"use client";

import { useState, type FormEvent } from "react";
import { CONFIG_AGENDA } from "@/config/agenda";
import type { Bloque, Cita, FechaISO } from "@/dominio/agenda";
import { reservarCita, type CodigoErrorReserva } from "@/dominio/reservas";
import { notificarCambioDeCitas } from "@/lib/citas-guardadas";
import { CLASES_FOCO, formatearFechaLarga } from "@/lib/formato";
import { guardarCitas, leerCitas } from "@/lib/repositorio-citas";

type CodigoError = CodigoErrorReserva | "NO_GUARDADA";

const MENSAJES: Record<CodigoError, string> = {
  NOMBRE_INVALIDO: "Escribe el nombre de quien reserva (máximo 80 caracteres).",
  HORARIO_INVALIDO: "Elige un horario de la lista.",
  HORARIO_PASADO: "Ese horario ya pasó. Elige uno más tarde.",
  HORARIO_OCUPADO: "Ese horario acaba de ocuparse. Elige otro.",
  NO_GUARDADA: "No pudimos guardar la cita en este navegador. Intenta de nuevo.",
};

const ID_ERROR = "error-reserva";

export function FormularioReserva({
  fecha,
  libres,
  reloj,
  alRechazar,
}: {
  fecha: FechaISO;
  libres: Bloque[];
  reloj: () => Date;
  alRechazar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [inicio, setInicio] = useState("");
  const [error, setError] = useState<CodigoError | null>(null);
  const [confirmacion, setConfirmacion] = useState("");
  // Si el bloque elegido dejó de estar libre (otra pestaña, o ya empezó), el select vuelve a vacío.
  const inicioVigente = libres.some((b) => b.inicio === inicio) ? inicio : "";

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setConfirmacion("");

    let citas: Cita[];
    try {
      // Se relee justo antes de reservar: otra pestaña pudo ocupar el bloque.
      citas = leerCitas(window.localStorage);
    } catch {
      notificarCambioDeCitas(); // la agenda pasa a su estado de error
      return;
    }

    const resultado = reservarCita({
      citas,
      solicitud: { nombre, fecha, inicio: inicioVigente },
      config: CONFIG_AGENDA,
      ahora: reloj(),
    });
    if (!resultado.ok) {
      setError(resultado.error);
      notificarCambioDeCitas(); // relee las citas por si la lista estaba vieja
      alRechazar(); // y vuelve a pintar con la hora actual
      return;
    }

    try {
      guardarCitas(window.localStorage, resultado.citas);
    } catch {
      setError("NO_GUARDADA");
      return;
    }
    notificarCambioDeCitas();
    setError(null);
    setNombre("");
    setInicio("");
    const { cita } = resultado;
    setConfirmacion(`Cita reservada: ${cita.nombre}, ${formatearFechaLarga(cita.fecha)} a las ${cita.inicio}.`);
  }

  const errorEnNombre = error === "NOMBRE_INVALIDO";
  const errorEnHorario = error !== null && !errorEnNombre && error !== "NO_GUARDADA";

  return (
    <form onSubmit={enviar} noValidate aria-labelledby="titulo-reserva" className="space-y-3 border-t border-borde pt-4">
      <h2 id="titulo-reserva" className="text-lg font-semibold">
        Reservar
      </h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="font-medium">
          Nombre
        </label>
        <input
          id="nombre"
          autoComplete="name"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setConfirmacion(""); // no dejar a la vista el nombre de la reserva anterior
          }}
          aria-invalid={errorEnNombre}
          aria-describedby={errorEnNombre ? ID_ERROR : undefined}
          className={`rounded-md border border-borde px-3 py-2 ${CLASES_FOCO}`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="horario" className="font-medium">
          Horario
        </label>
        <select
          id="horario"
          value={inicioVigente}
          onChange={(e) => setInicio(e.target.value)}
          aria-invalid={errorEnHorario}
          aria-describedby={errorEnHorario ? ID_ERROR : undefined}
          className={`rounded-md border border-borde bg-fondo px-3 py-2 ${CLASES_FOCO}`}
        >
          <option value="">Elige un horario</option>
          {libres.map((b) => (
            <option key={b.inicio} value={b.inicio}>
              {b.inicio} – {b.fin}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className={`rounded-md bg-acento px-4 py-2 font-medium text-acento-texto ${CLASES_FOCO}`}
      >
        Reservar
      </button>

      {error && (
        <p id={ID_ERROR} role="alert" className="rounded-md bg-error-fondo p-3 text-error-texto">
          {MENSAJES[error]}
        </p>
      )}
      {confirmacion && (
        <p role="status" className="rounded-md bg-exito-fondo p-3 text-exito-texto">
          {confirmacion}
        </p>
      )}
    </form>
  );
}
