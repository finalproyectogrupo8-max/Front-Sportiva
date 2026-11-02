# Cómo está armado el front

Guía para alguien que entra al proyecto: dónde va cada cosa, cómo funciona la sesión, cómo sumar una pantalla contra un endpoint nuevo y qué piezas del design system usar. Para levantarlo en local, ver el [README](../README.md).

## 1. La regla principal

**El browser nunca llama a la API.** Todo pasa por el servidor de Next.js:

- Las **páginas** (Server Components) leen datos con `apiFetch`.
- Las **mutaciones** son **Server Actions** (`'use server'`) que llaman a `apiFetch`.
- Los **client components** solo reciben datos por props y llaman a Server Actions.

El token vive en una cookie `httpOnly` que el JavaScript del browser no puede leer. El porqué está en el [ADR 0001](adr/0001-frontend-api-integration.md).

## 2. Sesión

| Cookie | Qué guarda | Para qué |
| --- | --- | --- |
| `sportiva_session` | El token **pre-tenant** (después del login) o el **del club** (después de elegirlo) | Todo lo del club (`/c/[club]`), `/clubes` y `/perfil` |
| `sportiva_platform` | El token **de plataforma** (solo admins de plataforma) | `/admin` y `/api/admin/*` (`apiFetch(..., { auth: 'platform' })`) |

Las dos son `httpOnly`, `sameSite=lax` y `secure` en producción, y vencen junto con su token.

El recorrido:

1. **Login** (`lib/auth.ts` → `login`): la API devuelve el token pre-tenant, y si es admin de plataforma también el de plataforma.
2. **Elegir club** (`/clubes` → `selectTenant`): cambia el token pre-tenant por el del club. Con un solo club entra directo.
3. **Cada pantalla** llama a `requireSession()` (`lib/session.ts`). Valida el token con `GET /me` y devuelve el usuario, el club activo, los permisos y su alcance. Está cacheada por request, así que el layout y la página no repiten la llamada.
4. **Errores:** 401 borra las cookies y va a `/sesion-expirada`; 403 de club (`tenant_required`, `membership_inactive`) va a `/clubes`; 403 de permiso muestra el error sin cerrar la sesión.

`proxy.ts` es un gate optimista: si no hay ninguna cookie, redirige al login. No valida el token; eso lo hace `requireSession()`.

El detalle (por qué existe el token pre-tenant, expiración, logout) está en [integracion-api-laravel.md](integracion-api-laravel.md#3-login-tokens-y-cookies).

### Permisos en la UI

`session.permissions` trae los permisos del usuario en el club (`players.view`, `matches.update`…) y `session.permissionScopes` su alcance (`all`, `sport`, `own`). Se usan **solo para mostrar u ocultar** botones y pantallas: la API los vuelve a validar en cada endpoint.

- En las páginas: `const can = (p: string) => permissions.has(p)` y se pasa `can={{…}}` al componente.
- En componentes del club: `useClub().can('players.create')`.
- Qué permiso habilita cada módulo: `lib/modules.ts`.

## 3. Mapa de carpetas

| Carpeta | Qué hay |
| --- | --- |
| `app/(marketing)` | Sitio público, con su propio CSS (`marketing.css`) |
| `app/(app)` | La aplicación: login, `/clubes`, `/perfil`, `/admin`, `/c/[club]/…` y la página pública de la convocatoria |
| `app/(app)/c/[club]/<modulo>/` | `page.tsx` (lee datos y permisos) y `actions.ts` (mutaciones) de cada módulo |
| `components/club/<modulo>/` | Los componentes de cada módulo |
| `components/club/shared.tsx` | `ModuleHeader`, `PageBody`, `Segmented`, `FormSelect`, `Pill`, `Meter`, `Stat` |
| `components/club/forms.tsx` | `ConfigSheet`, `ConfirmDialog`, `Field`, `FormError`, `SubmitButton`, `useConfigAction` |
| `components/ui/` | shadcn/ui |
| `lib/api/` | `client.ts` (`apiFetch`), un archivo por módulo y `schema.d.ts` generado |
| `lib/action-result.ts` | `runApiAction`, `runCall`, `failure`: el resultado de las Server Actions y los errores por campo |

## 4. Sumar una pantalla contra un endpoint nuevo

Ejemplo real: el tablero de una categoría en Análisis.

**1. Tipos.** Cuando la API mergea el endpoint (con `openapi.json` regenerado):

```bash
pnpm api:types   # actualiza lib/api/schema.d.ts
```

**2. La llamada**, en `lib/api/<modulo>.ts` (siempre con `import 'server-only'`):

```ts
export function categoryDetail(categoryId: number, period: Period): Promise<ApiResult<{ data: CategoryDetail }>> {
  return apiFetch(`/analytics/categories/${categoryId}`, { query: period })
}
```

`apiFetch` devuelve `{ ok: true, data }` o un error tipado (`kind: 'validation' | 'forbidden' | …`). No tira excepciones por errores HTTP.

**3. La página** (`app/(app)/c/[club]/analisis/[categoria]/page.tsx`): llama a `requireSession()`, revisa el permiso, pide los datos y se los pasa al componente.

```tsx
const session = await requireSession()
if (!session.permissions?.includes('physical_evaluations.view')) return <NoAccess moduleName="Análisis" homeHref={`/c/${club}`} />
const detail = await categoryDetail(categoryId, range)
if (!detail.ok) notFound()
return <CategoryDashboard detail={detail.data.data} /* … */ />
```

**4. Las mutaciones**, en `actions.ts` con `runApiAction`, que maneja el error de conexión, mapea los 422 a cada campo y revalida el club:

```ts
'use server'
export async function saveObjectiveAction(id: number | null, seasonId: number, formData: FormData): Promise<ActionResult> {
  const input = { /* … */ }
  return id
    ? runApiAction(() => updateObjective(id, input), 'Objetivo actualizado.', ['title', 'target_value'])
    : runApiAction(() => createObjective(input), 'Objetivo creado.', ['title', 'target_value'])
}
```

**5. El componente** (client) llama a la action con `useConfigAction()`, que muestra el toast al terminar y los errores por campo:

```tsx
const { pending, error, fieldErrors, execute } = useConfigAction()
execute(() => saveObjectiveAction(null, seasonId, formData), onClose)
```

Si la pantalla cambia el contrato de la API, van **dos PRs** (uno por repo), vinculados. Se mergea primero el de la API.

## 5. Design system

**Tokens** (`app/(app)/globals.css`): papel (`--paper`), tinta (`--ink`), terracota de la marca (`--primary` / `--brand`) y los de estado (`--success`, `--warning`, `--destructive`). Modo claro y oscuro con la clase `.dark`. El color de cada club (`--club`) es solo un acento: escudo y chips. La estructura y los botones son siempre de Sportiva.

**Tipografía:** Manrope para todo y Barlow Condensed (`font-display`) solo en los títulos de pantalla.

**Cuándo usar qué:**

| Necesidad | Pieza |
| --- | --- |
| Crear o editar algo con varios campos | Panel lateral: `ConfigSheet` (`wide` si es largo) |
| Confirmar algo destructivo o que no se deshace | `ConfirmDialog` |
| Avisar que algo salió bien | Toast (lo hace `useConfigAction` solo) |
| Error de un campo | `fieldErrors[campo]` debajo del input (`Field` lo muestra) |
| Error general del formulario | `FormError` |
| Lista vacía | `EmptyConfig` con el ícono, qué falta y la acción para empezar |
| Filtros o vistas | `Segmented` o `FormSelect`, con el estado en la URL (`?vista=`, `?periodo=`) |
| Gráficos | `components/ui/chart` (Recharts). Colores validados para contraste y daltonismo; cada gráfico con una tabla oculta para lectores de pantalla |

**Reglas:**

- Las fechas y horas se muestran en la zona del club (`CLUB_TZ`, `lib/club-time.ts`). Si no, el servidor y el browser formatean distinto y aparece un error de hidratación.
- Todo funciona en el celular (390 px), con la barra inferior de navegación (`MobileNav`). Revisá que nada se salga de la pantalla.
- Textos en español rioplatense, con voseo, sin jerga técnica.

**Revisión de diseño:** el módulo de Análisis se diseñó con [Impeccable](https://github.com/pbakaus/impeccable), en modo "operate": pantallas de trabajo, sin decoración, con los componentes de la app. Para revisar una pantalla nueva: se instala con `npx impeccable install` y se corre `/impeccable critique <pantalla>` en el asistente de código.

## 6. Antes del PR

- `pnpm lint`, `pnpm typecheck` y `pnpm build` en verde (la CI los corre igual).
- Probado en el browser, en escritorio y en celular, con un usuario con permisos y otro sin.
- Nada de datos de ejemplo: lo que no existe todavía muestra un estado vacío.
- Capturas en la descripción si cambia la UI.
