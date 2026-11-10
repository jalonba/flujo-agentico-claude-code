# CLAUDE.md — Agenda de citas (demo del flujo agéntico)

> El "cerebro" del proyecto: lo que cualquier agente debe saber **antes** de tocar el código.
> Es la plantilla real que uso en mis proyectos, aplicada a la demo de este repositorio.

## 1. Qué es

Una agenda de citas de un solo día a la vez: muestra los horarios libres y ocupados de una fecha y
permite reservar uno. Existe para demostrar el método (spec → HU → slice con TDD → verificador),
no como producto. **Es pequeña a propósito.**

## 2. Stack y comandos

| Pieza | Elección |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS 4 (tokens de color en `src/app/globals.css`) |
| Pruebas | Vitest + Testing Library + jsdom |
| Persistencia | `localStorage` del navegador (sin backend ni base de datos) |
| Idioma de la UI | Español (es-CO) |

Todo se corre dentro de `demo/`:

```bash
npm ci            # instalar exactamente el lockfile
npm run dev       # http://localhost:3000
npm run lint      # ESLint, 0 advertencias
npm run typecheck # tsc --noEmit
npm test          # vitest run
npm run build     # next build
```

## 3. Estructura

```
demo/src/
├── dominio/      # reglas puras (sin React, sin navegador): horarios y reservas
├── lib/          # adaptadores: reloj, repositorio de citas sobre Storage
├── components/   # UI cliente (Agenda, formulario de reserva)
├── app/          # rutas de Next.js
└── __tests__/    # guardias transversales (reloj inyectado, contraste)
```

Regla de dependencias: `components → lib → dominio`. El dominio no importa nada de afuera.

## 4. Cómo se trabaja aquí

1. **Spec primero.** Toda feature nace en `specs/prp-*.md` con criterios EARS y su backlog en
   `specs/historias/HU-XX.md`. Sin HU aprobada no hay código.
2. **Una HU = un slice vertical = sus propios commits.** Dominio + adaptador + UI de esa HU, nada más.
3. **TDD:** `test(HU-XX): …` en rojo (debe fallar por la razón esperada) → `feat(HU-XX): …` en verde
   → `refactor` solo si hace falta.
4. **Cada criterio `HU-XX.cN` tiene al menos un test** cuyo nombre empieza con su id.
5. **Cierre de HU:** `/verificador` en el mismo hilo → informe en `docs/verificaciones/VER-XX.md`
   con comandos corridos, salida resumida, hallazgos y veredicto.
6. **Commits en español con Conventional Commits** (`test`, `feat`, `fix`, `refactor`, `docs`, `chore`, `ci`).

### Definición de hecho (toda HU)

- [ ] Cada criterio de la HU tiene un test verde que lo nombra.
- [ ] `lint`, `typecheck`, `test` y `build` en verde, con la salida en el VER.
- [ ] Estados de carga, vacío y error cubiertos si la HU tiene UI.
- [ ] `/verificador` sin bloqueantes; observaciones anotadas.
- [ ] La HU queda en estado `Hecha` en su archivo de `specs/historias/`.

## 5. No hacer

- **No usar `new Date()` ni `Date.now()` en pruebas.** El reloj se inyecta (`ahora` / `reloj`).
  Hay una guardia automática que falla si aparece (`src/__tests__/guardia-reloj.test.ts`).
- **No leer el reloj dentro del dominio.** El dominio recibe `ahora` como parámetro.
- **No agregar backend, base de datos, auth ni librerías de estado.** Fuera de alcance de la demo.
- **No marcar un criterio como cumplido sin test que corra.** Un test no corrido es una hipótesis.
- **No usar color como único portador de información.** Todo estado va también en texto.
- **No versionar** `docs/prompts/`, `.blocklist.local` ni `.env*`.

## 6. Aprendizajes de este proyecto

> Formato: fecha · error · fix · dónde más aplica. Se agregan durante el bucle (auto-blindaje).

### 2026-11-10 · Afirmar la causa de una excepción, no solo su tipo (VER-01, H1)
- **Error:** `toThrow(RangeError)` pasaba con `duracionMin = 12.5` aunque se quitara la validación
  de duración: el `RangeError` venía de otro validador, más adelante.
- **Fix:** cada caso inválido afirma también el mensaje (`/Duración inválida/`, `/Hora inválida/`…).
- **Aplicar en:** toda prueba de error: tipo **y** causa. Se detectó por mutación, no leyendo.
