# PRP — Agenda de citas

**Estado:** APROBADO · **Fecha:** 2026-11-10 · **Backlog:** [`historias/`](historias/)

## Objetivo

Una página donde una persona ve los horarios libres y ocupados de un día y reserva uno con su
nombre, sin poder reservar un bloque ocupado o que ya pasó.

## Por qué

| Problema | Solución |
|---|---|
| Agendar por mensajes produce dobles reservas | La regla de no solapamiento vive en una función pura con pruebas |
| "¿Qué horas tiene libres?" exige ir y volver | La agenda del día muestra libres y ocupados de un vistazo |
| Reservas en horas que ya pasaron | El reloj se inyecta y toda regla temporal se prueba con él |

Valor para el repositorio: es la feature mínima que ejercita **dominio puro + UI + persistencia +
reglas temporales**, suficiente para mostrar el método completo sin backend.

## Criterios de éxito (EARS, nivel feature)

- [ ] **E1** — CUANDO se pide la agenda de una fecha, el sistema DEBE calcular los bloques libres a
      partir de apertura, cierre, duración, citas existentes y el reloj inyectado. → HU-01
- [ ] **E2** — CUANDO la persona abre la página o cambia la fecha, el sistema DEBE mostrar cada
      bloque futuro con su estado en texto (Libre / Ocupado), además de los estados de carga, vacío
      y error. → HU-02
- [ ] **E3** — SI la persona intenta reservar un bloque ocupado o que ya empezó, ENTONCES el sistema
      DEBE rechazarlo con un mensaje claro y no guardar nada. → HU-03
- [ ] **E4** — El sistema DEBE siempre conservar las citas reservadas al recargar la página
      (`localStorage`). → HU-03

## Comportamiento esperado (happy path)

1. La persona abre `/`. Se muestra la fecha de hoy y sus bloques de 30 min entre 08:00 y 17:00
   que aún no han empezado, cada uno marcado Libre u Ocupado.
2. Elige otra fecha: la lista se recalcula.
3. Escribe su nombre, elige un horario libre y pulsa **Reservar**.
4. Ve "Cita reservada…"; el bloque pasa a **Ocupado**. Al recargar, sigue ocupado.

## Contexto

### Arquitectura

```
components/Agenda.tsx ──► lib/repositorio-citas.ts ──► Storage (localStorage)
        │                         │
        └──────────► dominio/agenda.ts ◄──┘     (puro: sin React, sin navegador, sin reloj propio)
lib/reloj.ts: única fuente de "ahora" en producción; en pruebas se inyecta.
```

### Configuración (constante, no editable por la persona)

| Clave | Valor |
|---|---|
| `apertura` | `"08:00"` |
| `cierre` | `"17:00"` |
| `duracionMin` | `30` |

### Modelo de datos

| Entidad | Campo | Tipo | Regla |
|---|---|---|---|
| Cita | `id` | string | `"{fecha}T{inicio}"`; único porque dos citas no se solapan |
| Cita | `nombre` | string | 1–80 caracteres tras recortar espacios |
| Cita | `fecha` | string | `YYYY-MM-DD` |
| Cita | `inicio` | string | `HH:MM`, en la grilla del día |
| Cita | `fin` | string | `HH:MM`, `inicio + duracionMin` |
| Bloque | `inicio`, `fin` | string | `HH:MM`; `fin - inicio = duracionMin` |
| BloqueAgenda | `estado` | `"libre" \| "ocupado"` | derivado, no se guarda |

Clave de `localStorage`: `agenda-citas:v1` → JSON `Cita[]`.

### Algoritmo de horarios (detalle)

1. Validar entradas: `HH:MM` válidas, `apertura < cierre`, `duracionMin` entero > 0, fecha
   `YYYY-MM-DD` real. Si no, `RangeError`.
2. Grilla: desde `apertura`, bloques consecutivos de `duracionMin`; se incluye un bloque solo si
   `fin ≤ cierre` (el bloque que no cabe al final se descarta).
3. Un bloque **ya empezó** si `fecha + inicio ≤ ahora` (hora local). Esos no se muestran ni se
   pueden reservar.
4. Un bloque está **ocupado** si existe una cita de la misma fecha con
   `bloque.inicio < cita.fin && cita.inicio < bloque.fin`. Tocarse en el borde no es solaparse.
5. Libres = grilla − ya empezados − ocupados, ordenados por inicio.

### Ejemplos

| Entrada | Salida |
|---|---|
| 08:00–10:00, 30 min, sin citas, fecha futura | `08:00–08:30, 08:30–09:00, 09:00–09:30, 09:30–10:00` |
| igual + cita 08:15–08:45 | `09:00–09:30, 09:30–10:00` |
| 08:00–09:45, 30 min | `08:00, 08:30, 09:00` (09:30–10:00 no cabe) |
| fecha de hoy, `ahora` = 09:10 | `09:30–10:00` |
| fecha de ayer | `[]` |

### Post-condiciones de reservar

- Éxito: `localStorage["agenda-citas:v1"]` contiene la lista anterior + la cita nueva; la lista de
  entrada no se muta; el bloque aparece Ocupado.
- Rechazo: `localStorage` queda byte a byte igual que antes.

## Blueprint (backlog)

1. [HU-01 · Calcular horarios libres](historias/HU-01.md) — dominio, TDD estricto.
2. [HU-02 · Ver la agenda del día](historias/HU-02.md) — esqueleto que camina de la UI.
3. [HU-03 · Reservar una cita](historias/HU-03.md) — escritura + persistencia.

Nota: el esqueleto que camina es HU-01 + HU-02. HU-01 va primero a propósito porque la regla de
negocio es lo que más riesgo tiene y se puede probar sin UI.

## Fuera de alcance

Backend, base de datos, autenticación, cancelar o editar citas, varias agendas o profesionales,
zonas horarias distintas a la del navegador, notificaciones.

## Checklist de calidad de spec

- [x] Detalle algorítmico paso a paso (§ Algoritmo)
- [x] Formato de entrada/salida con tipos (§ Modelo de datos, HU-01)
- [x] Ejemplos concretos input → output (§ Ejemplos)
- [x] Post-condiciones (§ Post-condiciones)
- [x] Cero "debería/podría"

## Aprendizajes

_(se completan durante la implementación)_

## Gotchas

- Construir fechas con `new Date(año, mes - 1, día, h, m)` (hora local), nunca parseando
  `"YYYY-MM-DD"` con `new Date(string)`: eso lo interpreta como UTC y corre el día según la zona.

## Anti-patrones

- Leer `new Date()` dentro del dominio o en una prueba.
- Indicar el estado de un bloque solo con color.
