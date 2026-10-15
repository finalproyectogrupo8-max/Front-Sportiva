# ADR 0001 — Frontend ↔ Laravel API integration

- **Status:** Accepted
- **Date:** 2026-10-15
- **Context source:** OLIM data model and authentication draft (central `olim_platform` DB + one MySQL DB per club)

## Context

This repository is a Next.js 16 frontend only. A single Laravel application exposes the API. According to the data model:

- Users authenticate globally against `olim_platform.users`.
- `tenant_memberships` is the only source of authorization for accessing a club.
- A user with several clubs picks one. The session or token is then **bound to that tenant**, and every request must re-validate the user, the club and the membership.
- Operational data lives in each club's own database. Roles and permissions are per club (`roles`, `permissions`, `club_user_roles`).

We need to decide how the browser, Next.js and Laravel talk to each other, how authentication works, and how the tenant is carried.

## Decision

### 1. Backend-for-Frontend: the browser only talks to Next.js

```
Browser ──cookie──▶ Next.js server ──Bearer token──▶ Laravel API ──▶ olim_platform / club DB
```

- Server Components fetch data and Server Actions run mutations. Both call Laravel from the Next.js server.
- Client components never call Laravel directly. They call Server Actions.
- The Laravel URL is a **server-only** variable (`API_URL`, without the `NEXT_PUBLIC_` prefix).

**Why:** the token never reaches browser JavaScript, so an XSS bug cannot steal it. Laravel needs no CORS configuration and no cross-site cookies. The frontend already uses this pattern (`lib/auth.ts` is a Server Action that sets an `httpOnly` cookie).

### 2. Authentication: Laravel Sanctum API tokens, stored in an httpOnly cookie by Next.js

- Laravel issues **Sanctum personal access tokens**. They are opaque, stored server-side and revocable.
- The `personal_access_tokens` table lives in `olim_platform`, with a `tenant_id` column (nullable) added to it.
- Next.js stores the token in a cookie with `httpOnly`, `secure` (in production), `sameSite: 'lax'`, `path: '/'`, and the same expiry as the token.
- On logout, Next.js calls Laravel to revoke the token, then deletes the cookie.

**Rejected alternatives:**

- **Sanctum SPA mode** (stateful cookies + CSRF, with the browser calling Laravel directly). It requires a shared root domain, CORS with credentials and `SANCTUM_STATEFUL_DOMAINS`, and it is a frequent source of session bugs. With a BFF it brings no benefit.
- **JWT.** Revoking a JWT before it expires needs a denylist. The design asks to check membership on every request anyway, so a stateless token saves nothing.

### 3. The tenant is bound to the token, not sent by the client

This follows step 7 of the data model:

1. `POST /auth/login` (email, password) returns a **pre-tenant token** (`tenant_id = null`, ability `tenant:select` only) and the list of authorized clubs.
2. With one club, the frontend selects it automatically. With several, it shows the club selector (`/clubes`).
3. `POST /auth/select-tenant` (`tenant` = slug) makes Laravel re-validate the membership. It then revokes the pre-tenant token and issues a **tenant-scoped token**.
4. Every operational request uses the tenant-scoped token. Laravel middleware resolves the tenant **from the token**, re-checks user, club and membership status, and switches the DB connection.
5. Switching club goes through `select-tenant` again.

In the frontend, the `[club]` segment of `/c/[club]` is for navigation only. If it doesn't match the token's tenant, the app redirects to `/clubes`. It is **never** sent to the API as a source of authorization.

**Accepted trade-off:** a browser can only have one active club at a time, so two tabs cannot show two different clubs. This is acceptable for club staff. If it becomes a real need, the API could take the tenant from the path (`/t/{slug}/...`) and validate the membership on each request.

### 4. Permissions

`select-tenant` (and `GET /me`) return the user's club profile and the permission keys of their roles (for example `orders.approve`). The frontend only uses them to **show or hide UI**. Laravel enforces every permission again.

### 5. Frontend code layout

| Piece | Location | Responsibility |
| ----- | -------- | -------------- |
| API client | `lib/api/client.ts` (`import 'server-only'`) | Reads the cookie, calls `API_URL`, maps errors. A 401 deletes the cookie and redirects to `/`, a 403 redirects to `/clubes`, a 422 returns field errors to the form. |
| Session / DAL | `lib/auth.ts` | `login`, `selectTenant`, `logout`, `requireSession()`. These are the only functions that touch the cookie. |
| Optimistic gate | `proxy.ts` (Next 16 replaces `middleware.ts`) | Only checks that the cookie exists and redirects to `/` if it doesn't. It doesn't call the API: real checks happen in the DAL and in Laravel. |
| Domain calls | `lib/api/<module>.ts` | One file per module (players, orders, inventory…) returning typed data. |

Per-user data is never cached across users. Fetches use `cache: 'no-store'`, and mutations call `revalidatePath`.

### 6. API contract

Laravel publishes an OpenAPI document, generated from code (for example with `dedoc/scramble`). The frontend generates TypeScript types from it with `openapi-typescript`, so a breaking change in the API shows up as a type error. API enum values stay in English, matching the DB (`pending`, `approved`…). The frontend maps them to Spanish labels.

## Consequences

- `lib/auth.ts` (hardcoded `admin/admin`), `lib/tenants.ts` and `lib/data.ts` (mocks) will be replaced module by module.
- The current cookie uses `sameSite: 'none'`. It changes to `'lax'`: there is no cross-site use, and `lax` adds CSRF protection.
- Every request costs one extra hop (browser → Next → Laravel). Next.js and Laravel should be deployed close to each other (same region or network).
- Next.js must run as a server (no static export).

## Gaps found between the current UI and the data model

These need a product decision. The UI shows data that the model doesn't store:

- **Standings** (`Standing` in `lib/data.ts`): there is no table for tournaments or positions.
- **Player objectives** (`Objective`): the model explicitly removed `player_goals` and `goal_progress_updates`.
- **Coach notes** (`CoachNote`): there is no equivalent table.
- **Club profile** (`city`, `founded`, `color`, `members` in `lib/tenants.ts`): `tenants` only stores name, slug and connection data.
- **Order statuses:** the UI uses 4 states. The model has 7 (`draft … rejected`).

Options for each: remove the screen, keep it as "coming soon", or add the table to the model.
