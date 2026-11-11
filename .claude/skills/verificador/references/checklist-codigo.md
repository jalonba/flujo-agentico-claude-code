# Checklist de verificacion de codigo

> Stack: Next.js 14+ (App Router) + Supabase + TypeScript + Tailwind CSS + Vercel
> 2026-08-01: Paso 0 de evidencia de ejecucion obligatoria.
> 2026-08-17: Paso 0-bis — verificar el INSTRUMENTO antes de citarlo como constancia.
> 2026-08-24: Paso 0-ter — un verde sin control positivo no es evidencia; y verificación por mutación de todo gate nuevo.
> 2026-08-24: Paso 0-quáter — los estados de carga hacen que el arnés lea la pantalla equivocada; y la marca de fin del arnés debe ser la última línea del try.

## Orden de ejecucion

### 0. Evidencia de ejecucion (PRERREQUISITO — sin esto no hay score)

Correr (o exigir outputs de) TODOS antes de puntuar:

```bash
npx tsc --noEmit
npx eslint . --max-warnings=0
npm run build
npm test
npx playwright test        # obligatorio si la feature tiene UI
```

- [ ] Los 4-5 comandos corrieron y sus outputs estan en el reporte
- [ ] Si el verificador no puede ejecutar: reporte marcado INCOMPLETO + prompt para el agente con acceso al repo
- [ ] Feature con UI: al menos 1 flujo E2E verde "como usuario" antes de aprobar
- [ ] El score del LLM cubre SOLO lo no mecanizable: coherencia con PRP/SPEC, seguridad semantica, UX, arquitectura

### 0-bis. Verificar el INSTRUMENTO, no solo el sujeto

> **Regla: nunca cites como constancia un artefacto que no has visto ejecutarse.** Un test no
> corrido es una hipótesis, no evidencia. **Si el informe designa un artefacto como «la prueba»
> de algo, ese artefacto pasa a ser el PRIMER sujeto de la siguiente verificación, no el último.**

- [ ] ¿El reporte cita algún script/test como prueba de una propiedad (aislamiento, idempotencia, integridad)?
- [ ] Si sí: ¿se vio su salida real, o solo se leyó el código? **Sin salida, marcar el hallazgo como NO VERIFICADO.**
- [ ] **Scripts que ESCRIBEN en la base**: cruzar cada payload de `insert`/`upsert` contra las
      columnas `NOT NULL` **sin default** del esquema. PostgREST no rellena nada; una columna
      obligatoria omitida aborta el script antes de la primera aserción.
- [ ] Aserciones sobre errores: ¿afirman sobre el **código** (`42501` RLS, `23502` NOT NULL, `23503` FK)
      o solo sobre `error != null`? Lo segundo pasa por el motivo equivocado.
- [ ] Aserciones sobre listas: `(data ?? []).every(...)` y `(data?.length ?? 0) === 0` dan **PASS en vacío**.
      Exigir `error == null` **y** `Array.isArray(data)` antes de evaluar.
- [ ] ¿Hay **control positivo**? Sin él, unas políticas que negaran absolutamente todo darían
      verde en todas las aserciones de aislamiento.
- [ ] La prosa del repo (README, comentarios) **también se verifica contra el código**, no solo
      al revés: una afirmación falsa en el README puede ocultar un bug (origen: un hallazgo de verificación real).

> **Caso que originó la regla**: un script de verificación de RLS fue citado por dos verificaciones seguidas como *«la única
> prueba válida de que RLS aísla»*. Ninguna de las dos notó que sus `insert` omitían `user_id`
> (`NOT NULL` sin default) y que **el script no podía correr**. Lo encontró el agente implementador,
> no el verificador — leyendo el esquema para arreglar otra cosa.

### 0-ter. Un verde sin control positivo es una suposición con formato de evidencia

> **Regla madre**: antes de aceptar un PASS, pregunte **cómo se vería este gate si la propiedad
> estuviera rota**. Si la respuesta es «igual», el gate no prueba nada. Varias formas de la misma
> falla, todas vistas en proyectos reales:

**(a) El gate no ejerce el camino real.** Una capa nueva que interceptaba peticiones (un guard de
navegación) atrapaba también las rutas de API y devolvía una redirección a HTML en vez de JSON.
**Ningún gate de esa fase lo veía porque ninguno llamaba a una API a través de esa capa**; lo destapó
una suite adversarial de otra fase, con muchos fallos de golpe.
- [ ] ¿Los gates recorren el camino **real** del usuario, o solo las piezas por separado?
- [ ] Una capa nueva que intercepta (guard, middleware, proxy): ¿se probó con **cada tipo de
      consumidor** que la atraviesa — página, API, asset, callback?

**(b) El gate reporta desde un `finally` y no sabe si llegó al final.** Una suite imprimía «EN VERDE»
aunque una excepción cortara el recorrido a la mitad: el `finally` solo miraba el contador de fallos,
que seguía en 0 porque los asserts restantes nunca corrieron. Se detectó **por aritmética**: corrieron
bastantes menos asserts de los esperados.
- [ ] ¿La suite distingue «0 fallos» de «no llegué al final»? Debe reportar **INCOMPLETO**.
- [ ] ¿El **número de asserts ejecutados** aparece en la salida y coincide con lo esperado?
- [ ] Verificado metiendo un `throw` a mitad del recorrido: ¿lo dice, o sigue diciendo verde?

**(c) El gate pasa por vacío.** «No se envió ninguna notificación» habría sido verde **porque no
existía ningún destinatario** — verde por ausencia, no por corrección. La forma correcta: **sembrar
el destinatario, confirmar que era visible para el emisor, y recién entonces medir el silencio.**
- [ ] Toda aserción sobre algo que **no ocurrió** (no se envió, no se registró, no se contó):
      ¿existía la posibilidad real de que ocurriera? Si no, el test es decorativo.
- [ ] ¿Hay **control positivo** (mismo camino, condición invertida) además del negativo?

**(d) El gate corre, pero contra el sujeto equivocado — y no lo dice**. La suite sembraba su doble de
prueba con una credencial mientras el servidor usaba otra: la autorización fallaba y la operación
devolvía **cero filas sin error** — verde por desconexión. El caso espejo es peor: con el servidor
apuntando al origen real, la prueba habría traído **datos reales a un usuario de prueba**.
- [ ] ¿La suite **declara** contra qué está corriendo y **se niega** a correr si no es lo esperado?
      (Patrón: un guard que aborta con «base equivocada» y dice qué variable falta.)
- [ ] ⚠️ **Precedencia de entorno**: el shell **gana** sobre `--env-file`, y cada bloque de comandos
      es un shell nuevo. Un override que funcionó una vez puede no estar en la siguiente corrida.
- [ ] **Fallos intermitentes = arnés, no producto, hasta demostrar lo contrario.** Una capa de API
      que cachea el esquema puede no ver funciones recién creadas: el setup debe refrescarla y
      **esperar a verlas**. Un fallo que aparece y desaparece solo es peor que uno constante — enseña
      a re-correr hasta que pase.

**(e) La marca de «terminé» quedó a mitad del recorrido**. La regla (b) ya estaba escrita y **el
defecto volvió en otra forma**: la marca `completo = true` quedó fija en un punto del recorrido y las
secciones nuevas se agregaron **detrás** de ella. Una excepción en ellas seguía imprimiendo «EN
VERDE». Otra vez lo cazó la aritmética.
- [ ] `completo = true` es la **última línea del `try`**, con un comentario que dice por qué.
- [ ] El informe imprime **cuántas comprobaciones corrieron** y ese número se compara con lo esperado.
- [ ] Corolario general: **una decisión cerrada regresa sola si no entra al gate.** Escribir la regla
      no basta; hay que dejar el gate que la hace cumplir.

**Y el complemento: verificar por mutación.** Un gate nuevo no está probado hasta que se lo vio
**fallar** al romper a propósito lo que protege (quitar una exclusión, bajar un contraste, saltarse
una validación). Sin ese paso, un assert mal escrito y uno correcto se ven idénticos.
- [ ] Cada gate nuevo tiene su mutación documentada en el reporte, con el mensaje de fallo real.

### 0-quáter. El arnés habla con la pantalla, y la pantalla miente mientras carga

> Al añadir estados de carga (`loading.tsx`, skeletons), **el gate empieza a leer el esqueleto en vez
> del contenido**. Los huecos del skeleton son `aria-hidden`, así que el texto viene casi vacío y los
> elementos «no existen»: el gate lee una pantalla que no es la pantalla.

- [ ] **Toda** lectura, clic y relleno espera a que **no quede nada con `aria-busy`** y a que el `h1`
      tenga texto. No basta con esperar la navegación.
- [ ] **Asertar el identificador no basta**: un registro creado con el nombre correcto y el **monto en
      cero** pasa un assert que solo mira el nombre. Un `select` que provoca re-render puede pisar la
      escritura de otro campo. **Asertar también el valor**, en todas las entidades.
- [ ] **Los greps de control recorren el árbol completo**, no un archivo. Un grep que lee un solo
      fichero deja fuera cada componente nuevo — y sigue diciendo que pasó.
- [ ] **Colisión de selectores**: la CTA por clase CSS solo cuando es **la única de la
      pantalla**. En pantallas con formulario hay dos y la primera es la del formulario: seleccionar
      **por texto**.
- [ ] Si un assert **no puede fallar** cuando la propiedad se rompe, dígalo en el reporte y no lo
      cuente como cobertura. Un gate honestamente etiquetado como débil vale más que uno que finge.

### 1. Seguridad (BLOQUEA si falla)

#### Secrets y configuracion
- [ ] No hay API keys, tokens, o passwords en codigo fuente
- [ ] .env.local esta en .gitignore
- [ ] NEXT_PUBLIC_* solo contiene valores seguros para el cliente
- [ ] No hay secrets en next.config.js que lleguen al bundle del cliente

#### Inyeccion y XSS
- [ ] No hay dangerouslySetInnerHTML sin sanitizacion
- [ ] No hay eval(), Function(), o new Function() con input del usuario
- [ ] Queries a Supabase usan metodos del SDK, no SQL raw
- [ ] Si hay SQL raw, esta parametrizado con $1, $2...
- [ ] Inputs de usuario se validan con zod

#### Supabase RLS
- [ ] Cada tabla tiene RLS habilitado
- [ ] Politicas cubren SELECT, INSERT, UPDATE, DELETE
- [ ] UPDATE usa USING **y** WITH CHECK
- [ ] No hay politicas con USING (true) en tablas sensibles
- [ ] Roles derivados de app_metadata o tabla de roles — NUNCA de user_metadata (escribible por el usuario)
- [ ] La clave de servicio (admin, salta RLS) NUNCA en frontend
- [ ] anon key solo accede lo que las politicas permiten
- [ ] **Funciones nuevas en `public`: `revoke ... from public` NO se lo quita a `anon`**. Supabase concede EXECUTE a `anon` **por defecto** sobre toda función nueva del
      esquema `public`; hay que revocar de **`public, anon`** explícitamente. El síntoma de que está
      *cerrada* y no solo *defendida*: el assert falla con `permission denied for function`, no con
      el error de negocio de adentro. Un grant más ancho que la intención es deuda de seguridad
      aunque hoy no sea explotable — la próxima función que copie el precedente puede no tener esa
      primera línea de defensa.
- [ ] **Tabla que guarda un secreto**: el secreto va **hasheado** (bcrypt), nunca en claro, y la tabla
      lleva RLS **además** del `revoke`. Gate probado en los dos sentidos: con el secreto correcto
      hay filas, con uno falso hay cero.

#### Autenticacion
- [ ] Rutas protegidas verifican sesion en middleware o layout
- [ ] La autorizacion vive en la capa de datos (RLS) — el middleware NO es frontera de seguridad (leccion CVE-2025-29927)
- [ ] API routes validan supabase.auth.getUser()
- [ ] No hay rutas admin sin verificacion de rol

### 2. Tests

Comandos:
```bash
npm test
npm run test:coverage
npx playwright test
```

- [ ] Existen tests para funcionalidad nueva
- [ ] Happy path + edge cases + error cases
- [ ] Tests React con @testing-library/react
- [ ] Coverage >70% en funciones criticas
- [ ] Tests pasan en CI
- [ ] La suite NO encogio: nadie borro tests ni agrego .skip/.only para pasar el gate

### 3. Codigo limpio

Comandos:
```bash
npx eslint . --ext .ts,.tsx
npx tsc --noEmit
grep -rn "console.log" src/ --include="*.ts*"
grep -rn "// TODO\|// FIXME\|// HACK" src/
grep -rn ": any" src/ --include="*.ts*"
```

- [ ] ESLint pasa sin errores
- [ ] TypeScript compila sin errores
- [ ] No hay console.log() de debug
- [ ] No hay imports no usados
- [ ] No hay TODO/FIXME sin issue
- [ ] No hay any types innecesarios
- [ ] Funciones <50 lineas
- [ ] Archivos <300 lineas
- [ ] No hay codigo duplicado

### 4. Performance

- [ ] Componentes pesados usan dynamic() o React.lazy()
- [ ] Imagenes usan next/image
- [ ] useCallback/useMemo donde aplica
- [ ] No hay N+1 queries
- [ ] Paginas estaticas usan ISR/SSG

### 5. Frontend

- [ ] Responsive: mobile (375px), tablet (768px), desktop (1280px)
- [ ] Imagenes tienen alt descriptivo
- [ ] Forms con labels y mensajes de error
- [ ] Estados: loading, error, empty state
- [ ] Contraste WCAG AA (4.5:1)

### 6. Backend/Supabase

- [ ] Migraciones reversibles
- [ ] Edge Functions retornan errores con status codes correctos
- [ ] Validacion con zod en Edge Functions
- [ ] No hay SELECT * — solo columnas necesarias
- [ ] Queries pesadas tienen indices
- [ ] Webhooks: firma verificada (checksum / HMAC del proveedor) + idempotencia por event-id

## Patrones peligrosos (busqueda rapida)

```
dangerouslySetInnerHTML    -> XSS
eval(                      -> Code injection
createClient(.*SERVICE    -> Key admin en frontend
USING (true)               -> RLS abierta
user_metadata              -> Rol derivado de campo escribible por el usuario
SELECT *                   -> Over-fetching
.env                       -> Secrets en repo
.skip( / .only(            -> Test silenciado para pasar el gate
```
