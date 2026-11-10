"use client";

import { useState } from "react";
import { CONFIG_AGENDA } from "@/config/agenda";
import { calcularAgendaDelDia, esFechaValida, fechaISO, type BloqueAgenda } from "@/dominio/agenda";
import { notificarCambioDeCitas, useCitasGuardadas } from "@/lib/citas-guardadas";
import { CLASES_FOCO as FOCO, formatearFechaLarga } from "@/lib/formato";
import { relojDelSistema } from "@/lib/reloj";
import { FormularioReserva } from "./FormularioReserva";

export function Agenda({ reloj = relojDelSistema }: { reloj?: () => Date }) {
  const lectura = useCitasGuardadas();
  const [fechaElegida, setFechaElegida] = useState("");

  if (lectura.estado === "cargando") {
    return (
      <p role="status" aria-busy="true" className="text-texto-suave">
        Cargando agenda…
      </p>
    );
  }

  if (lectura.estado === "error") {
    return (
      <div role="alert" className="rounded-md bg-error-fondo p-4 text-error-texto">
        <p>No pudimos leer las citas guardadas en este navegador.</p>
        <button
          type="button"
          onClick={notificarCambioDeCitas}
          className={`mt-3 rounded-md bg-acento px-4 py-2 font-medium text-acento-texto ${FOCO}`}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const ahora = reloj();
  const hoy = fechaISO(ahora);
  const fecha = esFechaValida(fechaElegida) ? fechaElegida : hoy;
  const bloques = calcularAgendaDelDia({ ...CONFIG_AGENDA, citas: lectura.citas, fecha, ahora });
  const titulo = `Horarios del ${formatearFechaLarga(fecha)}`;

  return (
    <section aria-labelledby="titulo-agenda" className="space-y-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="fecha" className="font-medium">
          Fecha
        </label>
        <input
          id="fecha"
          type="date"
          min={hoy}
          value={fecha}
          onChange={(e) => setFechaElegida(e.target.value)}
          className={`w-fit rounded-md border border-borde px-3 py-2 ${FOCO}`}
        />
      </div>

      <h2 id="titulo-agenda" className="text-lg font-semibold first-letter:uppercase">
        {titulo}
      </h2>

      {!bloques.some((b) => b.estado === "libre") && (
        <p className="text-texto-suave">No quedan horarios libres para esta fecha.</p>
      )}

      {bloques.length > 0 && (
        <ul aria-label={titulo} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {bloques.map((b) => (
            <FilaBloque key={b.inicio} bloque={b} />
          ))}
        </ul>
      )}

      {bloques.length > 0 && (
        <FormularioReserva
          key={fecha}
          fecha={fecha}
          libres={bloques.filter((b) => b.estado === "libre")}
          reloj={reloj}
        />
      )}
    </section>
  );
}

function FilaBloque({ bloque }: { bloque: BloqueAgenda }) {
  const libre = bloque.estado === "libre";
  return (
    <li
      className={`flex items-center justify-between rounded-md px-3 py-2 ${
        libre ? "bg-libre-fondo text-libre-texto" : "bg-ocupado-fondo text-ocupado-texto"
      }`}
    >
      <span className="tabular-nums">
        {bloque.inicio} – {bloque.fin}
      </span>
      <span className="text-sm font-medium">{libre ? "Libre" : "Ocupado"}</span>
    </li>
  );
}
