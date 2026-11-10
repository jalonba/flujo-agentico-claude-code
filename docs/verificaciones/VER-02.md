# VER-02 · HU-02 Ver la agenda del día

```
VERIFICACION: HU-02 · página de agenda (dominio + lectura de localStorage + UI)
Agente origen: /bucle-agentico (modo SLICE)
Tipo: código
Evidencia de ejecución: SI — comandos y resultados abajo
Resultado: APROBADO CON OBSERVACIONES
Score: 9/10
```

**Fecha:** 2026-11-10 · **Commits:** `test(HU-02)` (rojo) → `feat(HU-02)` (verde)

## 1. Comandos corridos (en `demo/`)

| Comando | Resultado |
|---|---|
| `npx vitest run` sobre `test(HU-02)` | **rojo esperado**: 25 fallidas / 18 pasan (43). Fallan con `No implementado` (stubs) y `Token --color-… no encontrado` (gate de contraste antes de crear los tokens). Las 18 que pasan son las de HU-01 y las guardias |
| `npx vitest run` sobre `feat(HU-02)` | 43/43 verde (5 archivos) |
| `npm run lint` | exit 0, 0 advertencias (incluye las reglas de `react-hooks` 7) |
| `npm run typecheck` | exit 0 |
| `rm -rf .next && npm run build` | exit 0 · `/` prerenderizada estática |
| Prueba de humo en Chromium real (`next start` + Playwright, 390×900) | 18 bloques mañana, 18 «Libre»; foco con Tab en `#fecha` → `outline: solid 2px rgb(29, 78, 216)`; 0 errores de consola; `scrollWidth` 390 (sin scroll horizontal) |
| `npm audit` | **no concluyente**: el registro de npm respondía de forma intermitente (`EAI_AGAIN`); el reporte salió truncado. Se re-ejecuta en la verificación final |

## 2. Gate de HU (Regla 0.1)

| Criterio | Tests | Estado |
|---|---|---|
| HU-02.c1 fecha del reloj + estados en texto | `Agenda` c1 · `calcularAgendaDelDia` c1 · `interpretarCitas` c1 ×2 | ✅ |
| HU-02.c2 cambiar la fecha | `Agenda` c2 | ✅ |
| HU-02.c3 estado de carga | `Agenda` c3 (render en servidor con `renderToString`) | ✅ |
| HU-02.c4 estado vacío | fecha pasada · día lleno · **control positivo** (día con huecos no lo muestra) | ✅ |
| HU-02.c5 error + Reintentar | `Agenda` c5 (alerta y recuperación) · `interpretarCitas` c5 ×6 | ✅ |
| HU-02.c6 accesibilidad | `Agenda` c6 (label, estado en texto) · gate de contraste ×8 + control positivo | ✅ |

- **Alcance:** dominio (`calcularAgendaDelDia`, `fechaISO`, `esFechaValida`, `esCitaValida`), lectura de
  `localStorage`, componente `Agenda`, tokens de color y página. Sin escritura (eso es HU-03). ✅
- **Reloj:** el componente recibe `reloj`; el único `new Date()` de producción está en `lib/reloj.ts`. ✅
- **Prerender:** el snapshot de servidor de `useSyncExternalStore` es "pendiente", así que ni el reloj
  ni `localStorage` se tocan durante el prerender (compatible con `cacheComponents` de Next 16). ✅

### Contraste (recalculado con código sobre `globals.css`)

| Par | Colores | Ratio |
|---|---|---|
| texto / fondo | #0f172a / #ffffff | 17.85:1 |
| texto-suave / fondo | #475569 / #ffffff | 7.58:1 |
| libre-texto / libre-fondo | #065f46 / #ecfdf5 | 7.29:1 |
| ocupado-texto / ocupado-fondo | #334155 / #f1f5f9 | 9.45:1 |
| error-texto / error-fondo | #991b1b / #fef2f2 | 7.60:1 |
| exito-texto / exito-fondo | #065f46 / #ecfdf5 | 7.29:1 |
| acento-texto / acento | #ffffff / #1d4ed8 | 6.70:1 |
| foco / fondo (no texto, mínimo 3:1) | #1d4ed8 / #ffffff | 6.70:1 |

## 3. Verificación por mutación

| Mutación | Resultado |
|---|---|
| Estado vacío siempre visible | ❌ falla `HU-02.c4 · control positivo` ✔ |
| «Reintentar» no vuelve a leer | ❌ falla `HU-02.c5 · … recuperación sin recargar` ✔ |
| Bloque ocupado se pinta «Libre» | ❌ fallan `HU-02.c1` y `HU-02.c6` ✔ |
| `--color-libre-texto` → `#34d399` (poco contraste) | ❌ falla `HU-02.c6 · libre-texto sobre libre-fondo` ✔ |
| Aceptar citas guardadas con nombre vacío | ❌ falla `HU-02.c5 (nombre vacío)` ✔ |
| No validar la forma de las citas guardadas | ❌ fallan 4 casos `HU-02.c5` ✔ |
| Snapshot de servidor sin estado de carga | ❌ falla `HU-02.c3` ✔ |

## 4. Hallazgos

**H1 · Warning (herramienta) → documentado.** La primera prueba de humo mostró el foco con el color
por defecto del navegador. Causa: `next build` reutilizó el CSS de la caché de `.next` y **no
recompiló** `globals.css` tras agregar los tokens: el CSS servido no tenía ni una utilidad de color
propia. Con `rm -rf .next` el CSS sale completo y el foco usa el token. El CI no se ve afectado
(checkout limpio), pero una verificación visual local sí: queda como aprendizaje en `CLAUDE.md`.
Lo detectó la prueba en navegador real, no los tests de jsdom (que no aplican CSS).

**H2 · Info.** Estados de carga/error/vacío verificados en jsdom; la hidratación (snapshot de servidor
→ cliente) se verificó en navegador real sin errores de consola.

**H3 · Info.** En la prueba de humo, «hoy» (después de las 17:00) mostró correctamente el estado vacío:
ya no quedaban bloques. Por eso la prueba usa la fecha de mañana.

## 5. Veredicto

**APROBADO CON OBSERVACIONES.** Cada criterio tiene su prueba, cada prueba muere ante su mutación y el
comportamiento se confirmó en un navegador real. Observación abierta: `npm audit` pendiente por red.
