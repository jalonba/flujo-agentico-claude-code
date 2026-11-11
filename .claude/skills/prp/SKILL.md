---
name: prp
description: "Convierte una idea grande en una especificación aprobable antes de tocar código: un PRP (Product Requirements Proposal) con criterios EARS verificables y su backlog de historias de usuario, cada una un slice vertical. Usar antes de /bucle-agentico y cuando piden planear una feature, diseñar un sistema nuevo o «algo grande»."
context: fork
allowed-tools: Read, Write, Edit, Grep, Glob
---

> Basado en la metodología SaaS Factory (V3/V4), adaptado por Jairo Alonso Baquero.

# /prp — de la idea a una especificación aprobable

Feature pedida: $ARGUMENTS

Esta skill produce **documentos, no código**. Su salida es lo que el humano aprueba y lo que el
agente implementador usa como contrato: qué se construye, por qué, cómo se sabe que quedó bien y en
qué orden se entrega.

## ¿Hace falta un PRP?

Antes de empezar, decide si la tarea lo amerita:

| Señal | Decisión |
|---|---|
| Cabe en un cambio pequeño y revisar el diff es más rápido que leer una spec | **Sin PRP.** Iterar con pruebas. |
| Toca varias capas, tiene fases que dependen entre sí o decisiones de negocio abiertas | **Con PRP.** |
| Hay dinero, datos personales o borrado de por medio | **Con PRP**, aunque parezca pequeña. |

Una spec que cuesta más revisar que el código que describe es burocracia, no planeación.

## Qué entra y qué sale

| Entra | Sale |
|---|---|
| La idea del usuario (`$ARGUMENTS`) y sus respuestas | `specs/prp-<feature>.md` en estado `PENDIENTE` |
| El código y el esquema de datos **reales** del proyecto | El backlog: `specs/historias/HU-XX.md` (una por historia) o `docs/backlog/<feature>.md` |
| La plantilla `specs/prp-base.md`, si el proyecto tiene | Un resumen corto para que el humano apruebe o corrija |

## Recorrido

### 1. Partir del molde del proyecto

Si existe `specs/prp-base.md`, úsalo tal cual. Si no, la estructura mínima es la del paso 4.

### 2. Preguntar solo lo que falta

Necesitas cuatro cosas: **el estado final** (una o dos frases), **el problema que resuelve**, **cómo se
sabe que terminó** y **qué no se debe hacer**. Lo que ya venga en el pedido no se pregunta otra vez.
Pregunta corto y en un solo mensaje.

### 3. Leer el terreno antes de proponer

Busca en el repositorio lo que ya existe y se relaciona (componentes, rutas, reglas de dominio,
convenciones). Si hay base de datos, consulta su estructura **viva**, no solo las migraciones: es
frecuente que difieran. Lo que encuentres alimenta el contexto y la arquitectura del PRP; no se
propone arquitectura sin haber mirado.

### 4. Redactar el PRP

Archivo: `specs/prp-<feature-en-kebab-case>.md`. Secciones:

| Sección | Qué lleva |
|---|---|
| Objetivo | El estado final, en una o dos frases |
| Por qué | Problema → solución, y el valor que aporta |
| Criterios de éxito | 3 a 5 criterios de nivel feature, en EARS (paso 5) |
| Comportamiento esperado | El camino feliz contado de punta a punta |
| Contexto | Lo que ya existe, la arquitectura propuesta y el **modelo de datos como tabla** (entidad · campo · tipo · regla). Sin SQL. |
| Backlog | La lista ordenada de historias; cada una es una fase. Sin subtareas. |
| Aprendizajes · Gotchas · Anti-patrones | Vacías: se llenan durante la implementación |

### 5. Pasar el filtro de calidad

No se presenta un PRP que no pase este filtro. Los cinco elementos que más mejoran el resultado de un
agente según Midolo et al. (enero 2026), de mayor a menor efecto:

| Elemento | Se cumple cuando… |
|---|---|
| Detalle del algoritmo (57 %) | Toda lógica no trivial está escrita como pasos, no como un título |
| Forma de entradas y salidas (44 %) | Cada entrada y salida tiene tipo, forma y un ejemplo |
| Ejemplos concretos (24 %) | Cada comportamiento clave tiene al menos un caso entrada → salida real |
| Post-condiciones (23 %) | Está escrito qué es verdad después de cada operación |
| Claridad (19 %) | No hay «debería» ni «podría»: o es DEBE, o está fuera de alcance |

Los criterios se escriben con una de las cuatro plantillas EARS, para que cada uno se convierta en
una prueba sin interpretación:

- **Por evento:** CUANDO ocurre X, el sistema DEBE Y.
- **Por estado:** MIENTRAS se cumple X, el sistema DEBE Y.
- **No deseado:** SI pasa X (error), ENTONCES el sistema DEBE Y.
- **Siempre:** el sistema DEBE siempre Y.

> Vago: «la reserva funciona».
> EARS: «SI el horario pedido se cruza con una cita existente, ENTONCES el sistema DEBE rechazar la
> reserva con un mensaje que nombre el cruce y NO guardar nada».

Los criterios del PRP son pocos y de nivel feature; los que se vuelven pruebas viven en cada historia.
Cada criterio del PRP debe quedar cubierto por al menos una historia.

### 6. Cortar el backlog en historias

Una historia de usuario (HU) es la unidad de entrega. Cada una lleva: «Como [rol], quiero [acción],
para [beneficio]», criterios EARS numerados `HU-XX.cN` (un criterio, una prueba), reglas de negocio,
datos que toca, fuera de alcance, dependencias y tamaño.

Reglas de corte:

- **Vertical.** Atraviesa las capas que necesita y deja algo que se puede usar. Una HU de «todas las
  tablas» o «todo el frontend» es una capa, no una historia: se rechaza.
- **Pequeña.** S (hasta medio día) o M (hasta un día). Si sale L, se parte antes de presentarla.
- **Ordenada.** HU-01 es el recorrido mínimo de punta a punta que ya funciona; el resto va por
  prioridad (MoSCoW).
- **Sin datos de más.** Cada HU nombra solo los campos que usa; nada «para después».
- **Con piso de calidad.** Si crea una tabla, un criterio cubre el aislamiento de datos con control
  positivo y negativo; si crea una ruta o acción, un criterio cubre autenticación y validación de
  entradas.

Aprobado, el backlog vive en el repositorio y es el estado de verdad de la feature.

### 7. Entregar para aprobación

Resume en el chat: el objetivo, cuántas HU hay, cuál es la HU-01 y si alguna se partió, las
decisiones de arquitectura que pesan y la confirmación de que el filtro del paso 5 pasó. Pregunta qué
ajustar. **Aquí termina la skill**: nada se implementa hasta que el humano apruebe.

## Límites

- Solo escribe documentos. Ni código, ni SQL, ni endpoints, ni componentes.
- Las fases del backlog no se desglosan en subtareas: eso ocurre al entrar a cada una, con el
  contexto real de ese momento (lo hace `/bucle-agentico`).
- El PRP nace `PENDIENTE` y solo el humano lo pasa a aprobado.

## Después

Con el PRP y el backlog aprobados, `/bucle-agentico` implementa **una HU por vez** en modo SLICE:
rama y PR propios, TDD por criterio y revisión humana al cerrar cada historia. Lo que se aprenda
durante la implementación vuelve a la sección «Aprendizajes» de este PRP.
