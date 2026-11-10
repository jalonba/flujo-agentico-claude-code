# VER-03 · HU-03 Reservar una cita

```
VERIFICACION: HU-03 · reservar (dominio + escritura en localStorage + formulario)
Agente origen: /bucle-agentico (modo SLICE)
Tipo: código (toca datos personales: nombres) → incluye revisión adversarial independiente
Evidencia de ejecución: SI — comandos y resultados abajo
Resultado: APROBADO CON OBSERVACIONES (3 Warning y 4 Info corregidos en la HU; 2 Info documentados)
Score: 9/10
```

**Fecha:** 2026-11-10 · **Commits:** `test(HU-03)` (rojo) → `feat(HU-03)` (verde) →
`test(HU-03)` hallazgos adversariales (rojo) → `fix(HU-03)` (verde) → `test(HU-03)` blindaje →
`fix(HU-02)` layout móvil

## 1. Comandos corridos (en `demo/`)

| Comando | Resultado |
|---|---|
| `npx vitest run` sobre `test(HU-03)` | **rojo esperado**: 23 fallidas / 43 pasan (66). 17 por `No implementado`, 6 porque el formulario no existe (`Unable to find a label with the text of: Nombre`) |
| `npx vitest run` sobre `feat(HU-03)` | 66/66 verde |
| `npx vitest run` sobre los hallazgos adversariales | **rojo esperado**: 11 fallidas / 65 pasan (76), todas por aserción (reproducen cada hallazgo) |
| `npx vitest run` final | **76/76 verde** (7 archivos) |
| `npm run lint` · `npm run typecheck` | exit 0 · exit 0 |
| `rm -rf .next && npm run build` | exit 0 |
| Prueba de humo en Chromium real (390 px, build limpio) | nombre vacío → alerta + `aria-invalid="true"`; reservar 09:00 de mañana → «Cita reservada: Persona Demo, miércoles, 11 de noviembre de 2026 a las 09:00.»; el bloque pasa a «Ocupado», sale del select y **sigue ocupado tras recargar**; 0 errores de consola; 0 celdas desbordadas |
| `grep console.log / TODO / any / dangerouslySetInnerHTML` | 0 coincidencias |

## 2. Gate de HU (Regla 0.1)

| Criterio | Tests | Estado |
|---|---|---|
| HU-03.c1 reservar + confirmar + Ocupado | dominio c1 · UI c1 · UI c1 (confirmación se limpia) | ✅ |
| HU-03.c2 no solapamiento (incluida otra pestaña) | dominio c2 ×2 (+ control positivo) · UI c2 (otra pestaña sin evento) | ✅ |
| HU-03.c3 horario ya empezado | dominio c3 (+ control positivo) · UI c3 (reloj avanza antes de enviar) · UI c3 (repintado cada minuto) | ✅ |
| HU-03.c4 nombre inválido | dominio c4 ×3 + borde 80 + grafemas + invisibles ×4 · UI c4 (`aria-invalid` + `aria-describedby`) | ✅ |
| HU-03.c5 inicio fuera de la grilla | dominio c5 ×6 · UI c5 (sin horario elegido) | ✅ |
| HU-03.c6 persistencia | repositorio c6 (ida y vuelta) · UI c6 (remontaje) | ✅ |
| HU-03.c7 no muta + nunca solapa | dominio c7 (lista congelada) · propiedad: 18 reservas intercaladas sin solapes y el 19.º intento siempre `HORARIO_OCUPADO` | ✅ |

## 3. Verificación por mutación

| Mutación | Resultado |
|---|---|
| No comprobar solapamiento | ❌ fallan c2 (dominio), c7 (propiedad) y c2 (UI) ✔ |
| Solapamiento sin mirar la fecha | ❌ falla c2 · control positivo ✔ |
| No comprobar si ya empezó | ❌ fallan c3 dominio y c3 UI ✔ |
| No recortar el nombre | ❌ fallan c1 y c4 ✔ |
| Largo máximo 81 | ❌ falla c4 (81 caracteres) ✔ |
| Mutar la lista recibida | ❌ falla c7 ✔ |
| UI no relee antes de reservar | ❌ falla c2 UI ✔ |
| UI usa otra hora que la del envío | ❌ falla c3 UI ✔ |
| UI no guarda | ❌ fallan c1 y c6 UI ✔ |
| Error no asociado al campo | ❌ falla c4 UI ✔ |
| W1: aceptar citas guardadas con `fin ≤ inicio` | ❌ fallan los 2 casos W1 ✔ |
| W2: sin repintado periódico / tras rechazo | ❌ falla el test correspondiente en cada caso ✔ |
| W3: medir el nombre en unidades UTF-16 | ❌ falla el test de grafemas ✔ |
| I4: aceptar caracteres invisibles | 1.ª vez: **solo 2 de 4 fallan** → H-propio (abajo); tras blindar, 4 de 4 ✔ |
| I6: confirmación persistente | ❌ falla su test ✔ |

## 4. Revisión adversarial (agente independiente)

Un agente que no escribió el código recibió la spec y el código (no las conclusiones) con el encargo de
romperlo. Reprodujo con pruebas desechables:

| # | Sev. | Hallazgo | Estado |
|---|---|---|---|
| W1 | Warning | `esCitaValida` aceptaba citas guardadas con `fin ≤ inicio`: con `localStorage` manipulado, se podía reservar dos veces 09:00 | **Corregido**: dato corrupto (`fin > inicio` y nombre válido). Tests W1 |
| W2 | Warning | Tras «ya pasó» la lista no se repintaba (mismo texto en `localStorage` → `useSyncExternalStore` no re-renderiza), y sin temporizador los bloques vencidos seguían «Libre» | **Corregido**: repintado cada minuto y tras un rechazo. Tests W2 ×2 |
| W3 | Warning | «máximo 80 caracteres» medido en unidades UTF-16: 41 emojis ya eran rechazados | **Corregido**: grafemas con `Intl.Segmenter`. Test W3 |
| I4 | Info | Nombres solo con caracteres invisibles o de control (`​`, `\u0007`, `‮`…) | **Corregido**: se rechazan `\p{Cc}`/`\p{Cf}` (salvo ZWJ) y se exige una letra o número |
| I5 | Info | Una sola cita corrupta deja toda la agenda en error | **Decisión**: se mantiene. Fallar fuerte es preferible a reservar sobre datos dudosos (lección 7) |
| I6 | Info | La confirmación con el nombre anterior quedaba visible indefinidamente | **Corregido**: se limpia al escribir |
| I7 | Info | El select mostraba «Elige un horario» pero conservaba el valor de un bloque que dejó de estar libre | **Corregido**: el valor se deriva de los bloques libres |
| I8 | Info (sospecha) | Leer-y-escribir en `localStorage` no es atómico entre pestañas | **Límite conocido**: sin backend no hay transacción; fuera de alcance (PRP) |
| — | — | XSS: React escapa; `JSON.parse` con `__proto__` no contamina; fechas inexistentes rechazadas | Sin hallazgo |

## 5. Hallazgos propios del verificador

**H1 · Warning → corregido.** Al mutar I4, dos de los cuatro casos (`"​"`, `"\u0000"`) seguían
en verde: se rechazaban por «no tiene letras», no por ser invisibles. Pasaban por la razón equivocada
(el mismo patrón que H1 de VER-01). Se les agregaron letras (`"Ana​"`, `"\u0000Ana"`) y la
re-mutación hace fallar los 4.

**H2 · Warning → corregido (`fix(HU-02)`).** En la prueba en navegador a 390 px, el rango horario se
partía en dos líneas y, al impedirlo, «Ocupado» se desbordaba de la celda. Ahora la etiqueta baja de
línea; medición en navegador: 0 celdas con `scrollWidth > clientWidth`.

## 6. Veredicto

**APROBADO CON OBSERVACIONES.** Los 7 criterios tienen prueba y cada regla muere ante su mutación. La
revisión adversarial encontró 3 Warning reales que los tests del autor no cubrían; quedaron
reproducidos primero en rojo y luego corregidos. Observaciones abiertas: I5 (decisión) e I8 (límite
de una app sin backend).
