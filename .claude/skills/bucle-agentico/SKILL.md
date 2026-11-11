---
name: bucle-agentico
description: "Implementa una feature aprobada por fases, detallando cada fase solo al entrar a ella y con el estado real del código a la vista. Con backlog de historias trabaja una HU por vez con TDD (modo SLICE). Usar cuando un PRP está aprobado, o cuando la tarea cruza varias capas (datos, servidor, UI) con pasos que dependen unos de otros."
---

> Basado en la metodología SaaS Factory (V3/V4), adaptado por Jairo Alonso Baquero.
> El arranque de sesión y los artefactos de estado (`features-<feature>.json` y `progress-<feature>.md`)
> siguen el patrón de arnés para agentes de larga duración publicado por Anthropic (nov-2025).

# /bucle-agentico — implementar por fases sin planear a ciegas

## La idea

Un plan detallado de principio a fin se escribe sobre supuestos: cuando llega la fase 3, el código ya
no es el que se imaginó en la fase 1. Por eso el bucle separa dos niveles:

- **Al empezar** se fija solo la lista de fases (o de historias), en orden y con sus dependencias.
- **Al entrar a cada fase** se mira el estado real del sistema —incluido lo que se construyó en la
  fase anterior— y recién entonces se escriben las subtareas.

Planear tarde, con datos, en lugar de temprano, con suposiciones.

## Dos modos

| Hay backlog de HU (`specs/historias/` o `docs/backlog/`) | No hay backlog |
|---|---|
| **Modo SLICE**: la fase es la HU que se pidió, y el bucle se detiene al cerrarla | **Modo FASES**: se recorren todas las fases de la feature, una tras otra |

En ambos modos aplican el estado en el repositorio, el arranque de sesión y el auto-blindaje.

## El estado vive en el repositorio

La memoria del agente se pierde entre sesiones; el repositorio no. Dos archivos llevan el estado:

**`specs/features-<feature>.json`** — un registro por criterio de aceptación:

```json
{
  "prp": "specs/prp-agenda.md",
  "features": [
    {
      "id": "HU-03.c2",
      "criterio": "SI el horario se cruza con una cita existente, ENTONCES el sistema DEBE rechazar la reserva y NO guardar nada",
      "fase": "HU-03",
      "pass": false,
      "evidencia": null
    }
  ]
}
```

- `pass` cambia a `true` **solo** con evidencia de ejecución: qué se corrió y qué salió
  (`"npx vitest run reservas.test.ts → 9/9"`). Lo que el agente afirme no es evidencia.
- Se usa JSON a propósito: un agente reescribe prosa con facilidad, pero tiende a respetar campos.
- Un criterio no se edita para que pase. Si hay que cambiarlo, se cambia primero en la spec, con
  aprobación.

**`specs/progress-<feature>.md`** — al cerrar cada fase y cada sesión, cinco a diez líneas: qué se
hizo, en qué estado quedó de verdad, qué quedó a medias y cuál es el siguiente paso concreto.

## Arranque de sesión

Ninguna sesión empieza escribiendo código. Primero:

1. Leer `progress-<feature>.md`: dónde se quedó realmente el trabajo.
2. `git log --oneline -10`: qué quedó confirmado en commits.
3. Correr la verificación rápida (build y pruebas). **Si falla, arreglar eso antes que nada.**
4. Leer `features-<feature>.json`: qué criterios pasan y cuáles faltan.
5. Escoger **una** cosa. Solo una.

## El ciclo de una fase

1. **Delimitar.** Al inicio del trabajo: entender el resultado final, partirlo en fases ordenadas con
   sus dependencias y generar `features-<feature>.json` con todo en `false`. Sin subtareas todavía.
2. **Mapear.** Al entrar a la fase: qué archivos y patrones existen, qué se puede reutilizar, qué dejó
   construido la fase anterior y, si hay base de datos, su estructura real y sus políticas de acceso.
3. **Detallar.** Con ese mapa, escribir las subtareas de esta fase y solo de esta.
4. **Ejecutar.** Una subtarea a la vez; validar cada una al terminarla. Si algo falla, auto-blindaje
   (abajo).
5. **Cerrar.** La fase termina cuando sus criterios están en `pass: true` con evidencia (y, si tiene
   UI, el recorrido probado como lo haría un usuario). Se actualiza `progress`, se hace commit y se
   vuelve al paso 2 con la fase siguiente.

Al terminar la última fase: prueba de punta a punta, todos los criterios en verde con evidencia, y una
**comparación spec ↔ código**: lo prometido que no está y lo que está sin haberse especificado, con su
porqué, anotado en el PRP.

## Modo SLICE: una historia por vez

Diferencias con el ciclo general:

- **Arranque:** además del ritual, `git fetch`, `main` actualizada y rama `hu-XX-<slug>` desde
  `origin/main`. Se reporta el hash base.
- **Sin descomposición:** la fase es la HU pedida. Sus criterios `HU-XX.cN` se cargan en
  `features-<feature>.json`.
- **Una subtarea por criterio, en TDD:** prueba en rojo (y que falle **por la razón esperada**) →
  código mínimo → verde → commit → refactor solo si hace falta.
- **No se encadena:** al cerrar la HU no se empieza la siguiente. Se cierra con la Definición de
  Hecho, `/verificador` en el mismo hilo, push, PR y reporte; luego se para. La siguiente HU la decide
  el humano tras revisar el diff y la vista previa.

**Autonomía.** Dentro de la HU no se pide permiso entre prueba y prueba. Se para y se pregunta solo
ante: una decisión de negocio que los criterios no resuelven, una migración destructiva, una HU que
creció más de lo estimado (proponer cómo partirla) o un hallazgo fuera de la HU (se anota en el
backlog como `Propuesta` y no se implementa).

**Mínimo, pero con piso.** Nada «por si acaso»: ni campos, ni abstracciones, ni configuraciones que
ninguna HU pidió. Lo que no se recorta: aislamiento de datos en toda tabla nueva (con control positivo
y negativo), validación de entradas en el servidor y autenticación en toda ruta o acción nueva. Una
bandera que deja la fase apagada hasta activarla es una forma de desplegar, no sobreingeniería; una
bandera para algo que nadie pidió, sí lo es.

**Definición de Hecho de la HU:** cada criterio con prueba verde y evidencia · aislamiento de datos
revisado si tocó tablas · `/verificador` sin bloqueantes · la HU en `Hecha` en el backlog · PR con la
tabla criterio ↔ prueba, las migraciones y el hash base · reporte con el enlace del PR, la vista
previa y lo que quede pendiente de aplicar.

## Auto-blindaje: cada error deja una regla

Cuando algo falla: se corrige, se prueba que quedó corregido y **se escribe** para que no vuelva a
pasar.

```markdown
### AAAA-MM-DD · Título corto
- **Error:** qué falló, exactamente.
- **Fix:** cómo se corrigió.
- **Aplicar en:** dónde más vale esta regla.
```

| Alcance del aprendizaje | Dónde se escribe |
|---|---|
| Solo esta feature | Sección «Aprendizajes» del PRP |
| Varias features | La skill que corresponda (`.claude/skills/*/SKILL.md`) |
| Todo el proyecto | `CLAUDE.md` |

## Herramientas, a criterio

Los MCP y el navegador (consulta del esquema, errores del servidor de desarrollo, Playwright) son
herramientas para usar **cuando aportan**, no pasos fijos del plan. Un plan con «tomar captura» entre
cada línea de código mide actividad, no avance.

## Señales de que el bucle se desvió

| Señal | Corrección |
|---|---|
| Hay subtareas escritas para fases que aún no empiezan | Borrarlas; se escriben al entrar a cada fase |
| Se pasó a la fase siguiente sin mirar lo que dejó la anterior | Volver a mapear antes de detallar |
| Un criterio quedó en `pass: true` porque «ya funciona» | Correr la prueba y pegar la salida en `evidencia` |
| El plan nombra herramientas en vez de resultados | Reescribir las subtareas como resultados verificables |
| La sesión empezó escribiendo código | Hacer el arranque de sesión completo |
