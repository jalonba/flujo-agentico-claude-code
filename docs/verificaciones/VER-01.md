# VER-01 · HU-01 Calcular horarios libres

```
VERIFICACION: HU-01 · calcularHorariosLibres (dominio puro)
Agente origen: /bucle-agentico (modo SLICE)
Tipo: código
Evidencia de ejecución: SI — comandos y resultados abajo
Resultado: APROBADO (tras corregir 1 hallazgo en la misma HU)
Score: 9/10
```

**Fecha:** 2026-11-10 · **Commits:** `test(HU-01)` (rojo) → `feat(HU-01)` (verde) → `test(HU-01)` (blindaje del hallazgo H1)

## 1. Comandos corridos (en `demo/`)

| Comando | Resultado |
|---|---|
| `npx vitest run` sobre el commit `test(HU-01)` | **rojo esperado**: 15 fallidas / 2 pasan (17). Todas fallan con `Error: No implementado`; las 2 que pasan son la guardia de reloj y su control positivo |
| `npx vitest run` sobre `feat(HU-01)` | 17/17 verde |
| `npm run lint` (`eslint --max-warnings=0`) | exit 0 |
| `npm run typecheck` (`tsc --noEmit`) | exit 0 |
| `npm run build` (`next build`) | exit 0 · `✓ Compiled successfully` · `/` estático |
| `TZ=<zona> npx vitest run` en UTC, America/Bogota, Asia/Tokyo, Pacific/Kiritimati (UTC+14), America/Adak (UTC−10) | 17/17 en las 5 zonas |
| `grep console.log / TODO / FIXME / : any` en `src/` | 0 coincidencias |
| `npm audit` | **no ejecutado**: el registro de npm no respondía (`EAI_AGAIN`). Queda para el CI y la verificación final |

## 2. Gate de HU (Regla 0.1)

| Criterio | Test | Estado |
|---|---|---|
| HU-01.c1 día sin citas | `HU-01.c1 · día sin citas…` | ✅ |
| HU-01.c2 solapamiento + otras fechas | `HU-01.c2 · excluye los bloques…` | ✅ |
| HU-01.c3 bordes de apertura/cierre | `HU-01.c3 · citas en el borde…` | ✅ |
| HU-01.c4 duración que no cabe al final | `HU-01.c4 · no ofrece el bloque final…` | ✅ |
| HU-01.c5 fecha en el pasado | `HU-01.c5 · fecha en el pasado…` | ✅ |
| HU-01.c6 bloques ya empezados hoy | `HU-01.c6 · hoy: descarta…` (incluye borde 09:00 en punto) | ✅ |
| HU-01.c7 entradas inválidas | `HU-01.c7 · entrada inválida (…)` × 9 | ✅ |

- **Alcance:** el diff toca solo `src/dominio/agenda.ts`, sus pruebas y el soporte de pruebas (reloj + guardia). Sin UI ni persistencia. ✅
- **Reloj inyectado:** `calcularHorariosLibres` recibe `ahora`; el dominio no lee el reloj del sistema. La guardia `guardia-reloj.test.ts` recorre 3 archivos de prueba y tiene control positivo. ✅

## 3. Verificación por mutación (control positivo de las pruebas)

Se rompió a propósito cada regla y se comprobó que una prueba falla **por esa regla**:

| Mutación | Resultado |
|---|---|
| `yaEmpezo`: `<=` → `<` | ❌ falla `HU-01.c6` ✔ |
| `seSolapan`: `<` → `<=` (tocarse = solaparse) | ❌ falla `HU-01.c3` ✔ |
| Grilla sin descartar el bloque final | ❌ falla `HU-01.c4` ✔ |
| Ignorar la fecha de la cita | ❌ falla `HU-01.c2` ✔ |
| Una prueba agrega `Date.now()` | ❌ falla la guardia ✔ |
| Quitar toda validación de duración | vitest **se cuelga** (bucle infinito con `duracionMin = 0`) — se detecta, pero por cuelgue, no por aserción |
| Quitar solo la exigencia de entero | **⚠️ sobrevivió**: 17/17 verde → ver H1 |

## 4. Hallazgos

**H1 · Warning → corregido en la HU.** `HU-01.c7 (duración no entera)` pasaba por la razón equivocada:
con `duracionMin = 12.5` la grilla produce `"08:12.5"` y el `RangeError` lo lanza después el
validador de horas, no el de duración. La prueba aceptaba cualquier `RangeError`.
**Corrección:** cada caso de c7 afirma también la causa (`/Duración inválida/`, `/Hora inválida/`, …).
Re-mutación tras el blindaje: ❌ falla `HU-01.c7 (duración no entera)` ✔.

**H2 · Info.** Sin la validación de duración, `generarGrilla` entra en un bucle infinito. La
validación existe y está probada (c7), así que no se agrega una segunda defensa (sería sobreingeniería
para una función con un solo llamador).

## 5. Veredicto

**APROBADO.** Cada criterio tiene su prueba y cada prueba falla cuando se rompe su regla. H1 queda
corregido dentro de la HU.
