# ADR 0001 — Integración Frontend ↔ API Laravel

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Fuente del contexto:** modelo de datos y borrador de autenticación de OLIM (BD central `olim_platform` + una BD MySQL por club)

## Contexto

Este repositorio es solo el frontend, en Next.js 16. Una única aplicación Laravel expone la API. Según el modelo de datos:

- Los usuarios se autentican de forma global contra `olim_platform.users`.
- `tenant_memberships` es la única fuente de autorización para acceder a un club.
- Un usuario con varios clubes elige uno. A partir de ahí, la sesión o el token queda **atado a ese tenant**, y cada request tiene que volver a validar el usuario, el club y la membresía.
- Los datos operativos viven en la base de datos propia de cada club. Los roles y permisos son por club (`roles`, `permissions`, `club_user_roles`).

Hay que decidir cómo se comunican el browser, Next.js y Laravel, cómo funciona la autenticación y cómo se transporta el tenant.

## Decisión

### 1. Backend-for-Frontend: el browser solo habla con Next.js

```
Browser ──cookie──▶ Servidor Next.js ──Bearer token──▶ API Laravel ──▶ olim_platform / BD del club
```

- Los Server Components obtienen los datos y los Server Actions ejecutan las mutaciones. Los dos llaman a Laravel desde el servidor de Next.js.
- Los client components nunca llaman a Laravel directamente: llaman a Server Actions.
- La URL de Laravel es una variable **solo de servidor** (`API_URL`, sin el prefijo `NEXT_PUBLIC_`).

**Por qué:**
- El token nunca llega al JavaScript del browser, así que un XSS no puede robarlo.
- Laravel no necesita configurar CORS ni cookies cross-site.
- El frontend ya usa este patrón: `lib/auth.ts` es un Server Action que setea una cookie `httpOnly`.

### 2. Autenticación: API tokens de Laravel Sanctum, guardados por Next.js en una cookie httpOnly

- Laravel emite **personal access tokens de Sanctum**. Son opacos, se guardan del lado del servidor y se pueden revocar.
- La tabla `personal_access_tokens` vive en `olim_platform` y se le agrega una columna `tenant_id` (nullable).
- Next.js guarda el token en una cookie con:
  - `httpOnly`;
  - `secure` (en producción);
  - `sameSite: 'lax'`;
  - `path: '/'`;
  - el mismo vencimiento que el token.
- En el logout, Next.js le pide a Laravel que revoque el token y después borra la cookie.

**Alternativas descartadas:**

- **Modo SPA de Sanctum** (cookies stateful + CSRF, con el browser llamando a Laravel directamente).
  - Requiere un dominio raíz compartido, CORS con credenciales y `SANCTUM_STATEFUL_DOMAINS`.
  - Es una fuente frecuente de bugs de sesión.
  - Con un BFF no aporta ningún beneficio.
- **JWT.**
  - Revocar un JWT antes de que venza requiere una denylist.
  - El diseño exige verificar la membresía en cada request de todos modos, así que un token stateless no ahorra nada.

### 3. El tenant queda atado al token, no lo envía el cliente

Esto sigue el paso 7 del modelo de datos:

1. `POST /auth/login` (email, contraseña) devuelve un **token pre-tenant** (`tenant_id = null`, solo la ability `tenant:select`) y la lista de clubes autorizados.
2. Con un solo club, el frontend lo selecciona automáticamente. Con varios, muestra el selector de clubes (`/clubes`).
3. `POST /auth/select-tenant` (`tenant` = slug) hace que Laravel vuelva a validar la membresía. Después revoca el token pre-tenant y emite un **token atado al tenant**.
4. Cada request operativo usa el token atado al tenant. Un middleware de Laravel:
   - resuelve el tenant **a partir del token**;
   - vuelve a verificar el estado del usuario, el club y la membresía;
   - cambia la conexión de base de datos.
5. Para cambiar de club se vuelve a pasar por `select-tenant`.

En el frontend, el segmento `[club]` de `/c/[club]` es solo para navegar. Si no coincide con el tenant del token, la app redirige a `/clubes`. **Nunca** se envía a la API como fuente de autorización.

**Trade-off aceptado:** un browser solo puede tener un club activo a la vez, así que dos pestañas no pueden mostrar dos clubes distintos.
- Es aceptable para el personal del club.
- Si se vuelve una necesidad real, la API podría tomar el tenant del path (`/t/{slug}/...`) y validar la membresía en cada request.

### 4. Permisos

`select-tenant` (y `GET /me`) devuelven el perfil del usuario en el club y las permission keys de sus roles (por ejemplo `orders.approve`). El frontend las usa solo para **mostrar u ocultar UI**. Laravel vuelve a aplicar cada permiso.

### 5. Organización del código del frontend

| Pieza | Ubicación | Responsabilidad |
| ----- | --------- | --------------- |
| Cliente API | `lib/api/client.ts` (`import 'server-only'`) | Lee la cookie, llama a `API_URL` y mapea los errores. Un 401 borra la cookie y redirige a `/`, un 403 redirige a `/clubes` y un 422 devuelve los errores de campo al formulario. |
| Sesión / DAL | `lib/auth.ts` | `login`, `selectTenant`, `logout`, `requireSession()`. Son las únicas funciones que tocan la cookie. |
| Gate optimista | `proxy.ts` (en Next 16 reemplaza a `middleware.ts`) | Solo verifica que exista la cookie y, si no existe, redirige a `/`. No llama a la API: los chequeos reales ocurren en el DAL y en Laravel. |
| Llamadas de dominio | `lib/api/<módulo>.ts` | Un archivo por módulo (jugadores, pedidos, inventario…) que devuelve datos tipados. |

Los datos de un usuario nunca se cachean entre usuarios. Los fetch usan `cache: 'no-store'` y las mutaciones llaman a `revalidatePath`.

### 6. Contrato de la API

- Laravel publica un documento OpenAPI generado a partir del código (por ejemplo, con `dedoc/scramble`).
- El frontend genera los tipos de TypeScript a partir de ese documento con `openapi-typescript`. Así, un cambio que rompe la API aparece como un error de tipos.
- Los valores de los enums de la API quedan en inglés, igual que en la BD (`pending`, `approved`…). El frontend los traduce a etiquetas en español.

## Consecuencias

- `lib/auth.ts` (con `admin/admin` hardcodeado), `lib/tenants.ts` y `lib/data.ts` (mocks) se van a reemplazar módulo por módulo.
- La cookie actual usa `sameSite: 'none'` y pasa a `'lax'`: no hay uso cross-site, y `lax` agrega protección contra CSRF.
- Cada request suma un salto extra (browser → Next → Laravel). Next.js y Laravel conviene desplegarlos cerca (misma región o red).
- Next.js tiene que correr como servidor (sin static export).

## Diferencias detectadas entre la UI actual y el modelo de datos

Estas diferencias requieren una decisión de producto. La UI muestra datos que el modelo no guarda:

- **Tabla de posiciones** (`Standing` en `lib/data.ts`): no hay tablas de torneos ni de posiciones.
- **Objetivos de jugador** (`Objective`): el modelo eliminó explícitamente `player_goals` y `goal_progress_updates`.
- **Notas del entrenador** (`CoachNote`): no hay una tabla equivalente.
- **Perfil del club** (`city`, `founded`, `color`, `members` en `lib/tenants.ts`): `tenants` solo guarda nombre, slug y datos de conexión.
- **Estados de pedido:** la UI usa 4 estados y el modelo tiene 7 (`draft … rejected`).

Opciones para cada una: quitar la pantalla, dejarla como "próximamente" o agregar la tabla al modelo.
