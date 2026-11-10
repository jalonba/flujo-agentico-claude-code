# Reglas del stack tecnico

## Stack de referencia

| Componente | Tecnologia |
|-----------|-----------|
| Framework | Next.js 14+ (App Router) |
| Lenguaje | TypeScript 5+ |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Estilos | Tailwind CSS 3+ |
| Deployment | Vercel |
| Testing | Vitest + Testing Library |
| E2E | Playwright |
| Validacion | Zod |

## Convenciones

- Componentes: PascalCase (UserProfile.tsx)
- Utilidades: camelCase (formatDate.ts)
- Hooks: usePrefix (useAuth.ts)
- Types: PascalCase (UserProfile, CreateUserInput)
- Constantes: UPPER_SNAKE_CASE
- Strict mode TypeScript habilitado
- No any — usar unknown + narrowing
- RLS obligatorio en toda tabla
- Mobile-first responsive con md: y lg:
- fetch nativo, no axios
- date-fns, no moment.js
- No jquery, no lodash completo

## Migraciones (regla dura — la herramienta NO la hace cumplir)

- **Nunca se edita una migracion ya aplicada.** Un añadido va en una migracion nueva, siempre.
- ⚠️ **El runner no te protege**: salta los archivos ya aplicados **por nombre**, asi que editar uno
  aplicado no da error — simplemente no corre, y el cambio queda en el repo sin estar en la base. Si
  el añadido cae en una migracion **pendiente**, corre mezclado con ella y sin rastro de que era otra
  cosa. El daño depende del azar, no de una salvaguarda.
- **Verificar el esquema REAL, no las migraciones del repo**: las migraciones de un repositorio no
  son el estado de produccion (una migracion existia en la base y no en el repo; sincronizar sin ella
  habria aplicado un cambio de dinero no aprobado).
- **Orden respecto al deploy**: una migracion aditiva puede ir antes del deploy; una que elimina o
  cambia la firma de algo que produccion llama va despues.
- CHECKs sobre columnas nullable: usar `is not distinct from` / `coalesce`. `false OR NULL` = NULL
  y **Postgres acepta el CHECK** — pasa y no protege nada.

## Umbrales de calidad

| Metrica | Minimo | Ideal |
|---------|--------|-------|
| Test coverage (criticas) | 70% | 90% |
| ESLint errors | 0 | 0 |
| TS errors | 0 | 0 |
| Bundle size (First Load) | <200KB | <100KB |
| Lighthouse Performance | >70 | >90 |
| Lighthouse Accessibility | >80 | >95 |
| npm audit high/critical | 0 | 0 |
