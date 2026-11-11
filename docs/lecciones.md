# Lecciones: reglas aprendidas operando apps en producción con agentes

Cada regla nació de un error real en otros proyectos (no en la demo de este repositorio). Están
redactadas en abstracto, sin nombres de proyectos ni clientes. Formato: **la regla**, **el error que
la originó** y **cómo se verifica hoy**.

---

## 1. Un control sin control positivo no es un control

- **Error que la originó:** una suite de aislamiento de datos daba verde en todas sus aserciones. Al
  revisarla se vio que un sistema que negara *absolutamente todo* también habría dado verde: las
  aserciones solo comprobaban que "no se veía lo ajeno", nunca que "sí se veía lo propio". En otro
  caso, una aserción del tipo "no se envió ninguna alerta" pasaba porque no existía ningún
  destinatario al que enviarla.
- **Cómo se verifica hoy:** todo gate nuevo se acompaña de su **control positivo** (mismo camino,
  condición invertida) y se prueba **por mutación**: se rompe a propósito lo que protege y se
  comprueba que falla con el mensaje esperado. En este repo: la guardia de reloj inyectado y el gate
  de publicación prueban primero que detectan una muestra sembrada.

## 2. Un gate escrito por la misma mano que el código hereda sus puntos ciegos

- **Error que la originó:** un guard nuevo interceptaba también las rutas de API y devolvía HTML en
  vez de JSON. Ningún gate de la fase lo vio, porque los había escrito el mismo agente que escribió
  el guard, con el mismo modelo mental de "solo pasan páginas por aquí". Lo destapó una suite
  adversarial de otra fase.
- **Cómo se verifica hoy:** toda fase que toque **dinero, datos personales o borrado** lleva una
  **revisión adversarial con un agente independiente**, que recibe el código pero no las
  conclusiones del autor. Su encargo es romperlo, no aprobarlo.

## 3. Ninguna prueba lleva fecha literal; una suite que no se ejecuta no tiene color conocido

- **Error que la originó:** pruebas escritas con una fecha "futura" fija empezaron a fallar el día en
  que esa fecha pasó, sin que el código hubiera cambiado. En otro caso, un script citado durante
  semanas como "la prueba" de una propiedad no podía ejecutarse: omitía un campo obligatorio y
  abortaba antes de la primera aserción. Nadie lo había visto correr.
- **Cómo se verifica hoy:** el reloj se **inyecta** (`ahora` / `reloj`) y las fechas de prueba se
  derivan de él. Una guardia automática falla si una prueba llama a `new Date()` sin argumentos o a
  `Date.now()`. Ningún informe cita una prueba cuya salida no se haya visto.

## 4. Una migración aditiva puede ir antes del deploy; una que elimina o cambia la firma de algo que producción llama va después

- **Error que la originó:** una migración que cambiaba la firma de una función se aplicó antes de
  publicar el código que la usaba con la firma nueva. Durante esa ventana, un botón de producción
  llamaba a una función que ya no existía. Una migración aditiva antes del deploy sí habría sido
  correcta: la pregunta que decide no es «¿es reversible?», sino «¿alguien en producción llama esto
  ahora mismo?».
- **Cómo se verifica hoy:** cada migración se clasifica en el PR como **aditiva** (antes del deploy)
  o **destructiva / de cambio de firma** (después del deploy, y solo cuando nada en producción la
  llama). Para clasificarla se busca quién la llama en el código **publicado**, no en la rama. Las
  destructivas son parada obligatoria del bucle.

## 5. Un estado intermedio que nadie vigila es un estado final

- **Error que la originó:** una sincronización quedó *configurada pero nunca activada*, y su tarea
  programada corrió unas tres semanas en vacío, sin error ni alerta. La alerta vigilaba «caída», y
  «nunca activada» no es «caída». Además, un paso del onboarding que encendía una función pagada se
  podía omitir en silencio.
- **Cómo se verifica hoy:** todo estado intermedio («configurado», «pendiente», «a medias») tiene
  **dueño y plazo**, y una consulta de vigilancia cuenta cuántos llevan más del plazo; ese número debe
  ser cero. Las alertas cubren también «nunca empezó», no solo «se cayó». Un paso que enciende algo
  que se cobra no se puede saltar sin dejar constancia visible.

## 6. Un freno se pone sobre la magnitud que de verdad limita, no sobre una que se le parece

- **Error que la originó:** se limitó una carga de histórico a «máximo 12 meses» porque se temía que
  fuera demasiado grande. Lo que de verdad limitaba era el volumen: al medirlo, eran unos cientos de
  filas que cargaban en segundos. El freno estaba sobre la magnitud equivocada y recortaba datos
  útiles sin proteger nada.
- **Cómo se verifica hoy:** antes de poner un límite se **mide** y se escribe qué recurso se agota o
  qué costo crece, y el límite se expresa en esa misma magnitud (filas, no meses). La prueba del freno
  usa el caso extremo de la magnitud real, no el promedio.

## 7. Un valor por defecto que elige solo una cuenta de dinero es peor que un error

- **Error que la originó:** un sincronizador que no tenía cuenta destino configurada tomaba «la
  primera cuenta activa» del usuario. Con eso, más de un año de movimientos habría caído en su caja
  de efectivo. Nada habría fallado: los saldos simplemente habrían quedado mal. El error se ve; el
  silencio no.
- **Cómo se verifica hoy:** se eliminó el valor por defecto. En todo lo que mueve dinero, la ausencia
  de un dato obligatorio **detiene la operación con un error explícito y una alerta**. Hay pruebas que
  verifican que sin ese dato no se escribe nada.

## 8. Un resumen operativo de un runbook no se ejecuta hasta que alguien lo contrasta contra el runbook

- **Error que la originó:** una hoja de corte resumida —legible y convincente— omitía la guarda del
  `UPDATE` (la condición sobre el valor anterior y la comprobación de que afectara exactamente una
  fila), cuatro de los siete bloqueantes del runbook, y usaba como verificación una vista que daba un
  **falso positivo garantizado**. No la salvó revisarla mejor, sino leerla contra el runbook fuente.
- **Cómo se verifica hoy:** un resumen operativo lleva la referencia al runbook y se contrasta
  **paso por paso** contra él antes de ejecutarse: guardas de cada escritura, lista completa de
  bloqueantes y, para cada verificación, cómo se vería si el paso hubiera fallado. Si no coinciden,
  manda el runbook y el resumen se corrige.

## 9. Las suites que verifican residuo en la base se corren solas, nunca en paralelo

- **Error que la originó:** una suite que comprobaba "no quedó basura después de la prueba" fallaba
  de forma intermitente. La basura era de otra suite que corría al mismo tiempo. Un fallo que aparece
  y desaparece es peor que uno constante: enseña a re-correr hasta que pase.
- **Cómo se verifica hoy:** esas suites están marcadas como **seriales** y el runner las ejecuta en
  un paso aparte. Un fallo intermitente se trata como un defecto del arnés hasta demostrar lo
  contrario.

## 10. Toda tarea programada deja su propio rastro en la base: los logs del proveedor caducan

- **Error que la originó:** en el plan gratuito del hosting, los logs de ejecución duraban una hora.
  Una tarea programada de madrugada era inauditable al empezar el día: no había forma de saber si
  había corrido ni qué había hecho.
- **Cómo se verifica hoy:** cada ejecución de una tarea programada escribe **su propio rastro en la
  base** (última corrida, conteos, motivo de fallo). Una consulta de vigilancia detecta ejecuciones
  que faltan o que terminaron en error. La única evidencia útil es la que la tarea deja ella misma.

---

### Cómo nace una lección

En el bucle de desarrollo, cada error pasa por **auto-blindaje**: se arregla, se prueba y se
documenta. Si aplica a un proyecto, va a su `CLAUDE.md`; si aplica a cualquier proyecto, sube al
skill correspondiente (`.claude/skills/*/SKILL.md`) o a esta lista.
