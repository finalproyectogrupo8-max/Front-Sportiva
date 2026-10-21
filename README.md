# Gestión Operativa — Club Deportivo

Panel de gestión operativa para clubes deportivos: partidos, fichas de jugadores, profes, materiales y canchas, con un espacio separado para cada club.

Este repositorio es **solo el frontend**. Va a consumir una **API REST en Laravel** que vive en su propio repositorio y es dueña de la lógica de negocio, la persistencia y la autenticación.

Hecho con **Next.js 16** (App Router + Turbopack), **React 19**, **TypeScript**, **Tailwind CSS 4** y **shadcn/ui**.

> **Estado:** prototipo, todavía no conectado a la API. El login está hardcodeado (`lib/auth.ts`) y todos los datos son mock (`lib/data.ts`). Las dos cosas se van a reemplazar por llamadas a la API de Laravel.

---

## 1. Correr la app en local

### Requisitos previos

| Herramienta | Versión                         | Cómo verificarla |
| ----------- | ------------------------------- | ---------------- |
| Node.js     | 20.9 o superior (probado con 24) | `node -v`        |
| pnpm        | 12.x                            | `pnpm -v`        |
| Git         | cualquier versión reciente      | `git --version`  |

Si no tenés pnpm, la forma más simple de instalarlo es con Corepack, que viene con Node:

```bash
corepack enable
```

Corepack usa después la versión de pnpm fijada en `package.json` (campo `packageManager`).

> Usá **solo pnpm**. No corras `npm install` ni `yarn`: ignoran `pnpm-lock.yaml` y generan otro lockfile distinto.

### Pasos

```bash
# 1. Clonar el repositorio
git clone <REPO_URL>
cd gestion-operativa-club-deportivo

# 2. Instalar dependencias (versiones exactas del lockfile)
pnpm install --frozen-lockfile

# 3. Levantar el servidor de desarrollo
pnpm dev
```

Abrí <http://localhost:3000> e ingresá con:

- **Usuario:** `admin`
- **Contraseña:** `admin`

### Scripts disponibles

| Comando                  | Qué hace                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `pnpm dev`               | Servidor de desarrollo con hot reload en el puerto 3000       |
| `pnpm build`             | Build de producción                                           |
| `pnpm start`             | Sirve el build de producción (primero hay que correr `build`) |
| `pnpm lint`              | Revisa el código con ESLint (`eslint.config.mjs`)             |
| `pnpm typecheck`         | Chequeo de tipos con `tsc --noEmit` (ver la nota de abajo)    |

> **Importante:** `next.config.mjs` tiene `typescript.ignoreBuildErrors: true`, así que `pnpm build` **no falla por errores de tipos**. Corré `pnpm typecheck` antes de abrir un pull request. La CI también lo corre (ver [3.4](#34-ci-integración-continua)).

### Variables de entorno

Mientras la app use datos mock no hace falta ninguna. Cuando se conecte la API de Laravel:

| Variable  | Ejemplo                     | Notas                                                                    |
| --------- | --------------------------- | ------------------------------------------------------------------------ |
| `API_URL` | `http://localhost:8000/api` | URL base de la API de Laravel. **Solo de servidor**: nunca usar `NEXT_PUBLIC_`. |

El browser nunca llama a Laravel directamente. Todas las llamadas pasan por el servidor de Next.js, que guarda el token de Sanctum en una cookie `httpOnly`. El razonamiento está en el [ADR 0001](docs/adr/0001-frontend-api-integration.md), y el detalle del login y del contrato de la API, en [docs/integracion-api-laravel.md](docs/integracion-api-laravel.md).

Los valores locales van en `.env.local`. Ese archivo está en el `.gitignore`, así que nunca se commitea. Cada variable nueva se documenta en este README, y se commitea un `.env.example` con valores de ejemplo.

Tené en cuenta que cualquier variable con el prefijo `NEXT_PUBLIC_` se envía al browser. **Nunca** pongas secretos (API keys, tokens) en una variable `NEXT_PUBLIC_`.

### Trabajar contra la API de Laravel

Cuando exista la integración, vas a necesitar la API de Laravel corriendo en local (o una URL de desarrollo compartida). Las instrucciones de instalación están en el repositorio de la API.

Los cambios de frontend y backend que dependen entre sí necesitan **un PR en cada repositorio**. Vinculá los dos PRs y mergeá primero el de la API.

### Problemas comunes

- **El puerto 3000 ya está en uso:** corré `pnpm dev -- -p 3001`.
- **Errores después de hacer pull:** probablemente alguien cambió dependencias. Corré `pnpm install` de nuevo.
- **Problemas raros de caché del build:** borrá la carpeta `.next/` y reiniciá `pnpm dev`.

---

## 2. Estructura del proyecto

```
app/                 Rutas (Next.js App Router)
  page.tsx           Login
  admin/             Administración de usuarios, clubes y membresías
  clubes/            Selector de club
  c/[club]/          Panel de un club (ruta dinámica)
components/
  ui/                Componentes base de shadcn/ui
  auth/ brand/ club/ modules/   Componentes de cada funcionalidad
docs/                Documentación (ADRs, integración con la API, CI)
hooks/               Hooks de React propios
lib/                 Auth, datos mock, tenants, helpers
public/              Archivos estáticos
```

`AGENTS.md` y `CLAUDE.md` los crea automáticamente `next dev`. Son instrucciones para asistentes de código con IA y se commitean como cualquier otro archivo.

---

## 3. Flujo de trabajo con Git: branches y pull requests

Usamos un **flujo trunk-based** simple:

- `main` siempre tiene código que funciona y se puede desplegar.
- Nadie pushea directo a `main`. Todo cambio pasa por un **branch** y un **pull request (PR)**.
- Los branches duran poco: la idea es mergear cada uno en pocos días.

### 3.1 Nombres de branches

Formato: `<tipo>/<descripcion-corta-en-kebab-case>`

| Tipo        | Para qué se usa                              | Ejemplo                      |
| ----------- | -------------------------------------------- | ---------------------------- |
| `feature/`  | Funcionalidad nueva                          | `feature/match-calendar`     |
| `fix/`      | Corrección de bugs                           | `fix/login-redirect-loop`    |
| `refactor/` | Cambios de código que no cambian el comportamiento | `refactor/split-data-module` |
| `docs/`     | Solo documentación                           | `docs/update-readme`         |
| `chore/`    | Dependencias, configuración, herramientas    | `chore/upgrade-next`         |

Si usan un issue tracker, pueden agregar el número del issue: `feature/42-match-calendar`.

### 3.2 Paso a paso

```bash
# 1. Partir de un main actualizado
git checkout main
git pull origin main

# 2. Crear tu branch
git checkout -b feature/match-calendar

# 3. Trabajar y commitear en pasos chicos y enfocados
git add <archivos>
git commit -m "feat: add monthly match calendar view"

# 4. Antes de pushear, ponerte al día con main y verificar que todo siga funcionando
git fetch origin
git rebase origin/main          # o: git merge origin/main
pnpm lint
pnpm typecheck
pnpm build

# 5. Pushear tu branch
git push -u origin feature/match-calendar
```

Después abrí el pull request en GitHub, con el botón **"Compare & pull request"** o desde la línea de comandos:

```bash
gh pr create --base main --fill
```

### 3.3 Mensajes de commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>: <qué cambió, en modo imperativo>

feat: add equipment inventory table
fix: keep selected club after page refresh
refactor: extract kit color helpers
docs: explain branch workflow
chore: bump tailwindcss to 4.3.3
```

Cada commit tiene que hacer una sola cosa. No mezcles cambios que no tienen relación en un mismo commit.

### 3.4 CI (integración continua)

Cada pull request a `main`, y cada push a `main`, corre el workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) en GitHub Actions. El job `verify`:

1. instala las dependencias con `--frozen-lockfile` (falla si `pnpm-lock.yaml` no coincide con `package.json`);
2. corre `pnpm lint`;
3. corre `pnpm typecheck`;
4. corre `pnpm build`.

El resultado aparece en el PR como un check (✓ o ✗). Con la protección de `main` activa (ver [3.8](#38-configuración-recomendada-del-repositorio-para-maintainers)), un PR con el check en rojo no se puede mergear. Si falla, abrí el detalle del check, corregí el problema en tu branch y pusheá de nuevo: la CI vuelve a correr sola.

La guía completa (errores frecuentes, decisiones técnicas y próximos pasos) está en [docs/ci.md](docs/ci.md).

### 3.5 Checklist del pull request

Antes de pedir una revisión, verificá que:

- [ ] El branch está al día con `main`.
- [ ] El check `verify` de la CI está en verde (o corriste `pnpm lint`, `pnpm typecheck` y `pnpm build` en local).
- [ ] Probaste el cambio a mano en el browser (`pnpm dev`).
- [ ] El PR es chico y hace una sola cosa. Los cambios grandes se dividen en varios PRs.
- [ ] La descripción explica **qué** cambió, **por qué** y **cómo probarlo**. Para cambios de UI, agregá capturas.
- [ ] No hay secretos, archivos `.env` ni cambios ajenos al PR.

Descripción sugerida para el PR:

```markdown
## Qué
Resumen corto del cambio.

## Por qué
El problema que resuelve o la funcionalidad que agrega.

## Cómo probarlo
1. Correr `pnpm dev`
2. Ingresar como admin/admin
3. Ir a ... y verificar que ...

## Capturas
(para cambios de UI)
```

### 3.6 Revisión y merge

1. Al menos **otro desarrollador** aprueba el PR.
2. El autor resuelve los comentarios pusheando más commits al mismo branch. El PR se actualiza solo.
3. Se mergea con **"Squash and merge"**, así cada PR queda como un único commit limpio en `main`.
4. Después del merge se borra el branch. En local:

   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/match-calendar
   ```

### 3.7 Resolver conflictos

Si tu branch tiene conflictos con `main`:

```bash
git fetch origin
git rebase origin/main
# Git se detiene en cada conflicto: editá los archivos y después
git add <archivos-resueltos>
git rebase --continue
# Como el rebase reescribe la historia de tu branch, pusheá con:
git push --force-with-lease
```

Usá `--force-with-lease` solo en **tu propio** branch, nunca en `main` ni en un branch en el que esté trabajando otra persona. A diferencia de `--force`, se niega a pisar commits que no viste.

Si hay conflicto en `pnpm-lock.yaml`, no lo arregles a mano. Tomá la versión de `main` y reinstalá:

```bash
git checkout --ours pnpm-lock.yaml   # durante un rebase, --ours = la versión de main
pnpm install                         # vuelve a aplicar los cambios de package.json de tu branch
git add pnpm-lock.yaml
```

> Durante un **rebase**, `--ours` es `main` y `--theirs` es tu branch: al revés que en un merge. En general conviene la versión de main (`--ours`) y después correr `pnpm install` para que se vuelvan a agregar tus cambios de dependencias.

### 3.8 Configuración recomendada del repositorio (para maintainers)

La hace quien tenga permiso de **admin** en el repositorio. En un repo de una cuenta personal, eso es solo el dueño.

> **Requisito de plan:** en repos **privados**, la protección de branches solo se aplica con GitHub Pro, Team o Enterprise. Con el plan Free, solo funciona en repos públicos.

En GitHub, entrá a **Settings → Rules → Rulesets → New ruleset → New branch ruleset**:

- **Enforcement status:** Active.
- **Target branches:** Include default branch (`main`).
- **Bypass list:** vacía, para que la regla aplique a todos, incluido el dueño.
- Reglas:
  - Restrict deletions.
  - Block force pushes.
  - Require a pull request before merging, con 1 aprobación como mínimo. Conviene activar también "Dismiss stale pull request approvals when new commits are pushed" y "Require conversation resolution before merging".
  - Require status checks to pass, agregando el check `verify`. Solo aparece en la lista después de que la CI corrió al menos una vez.

Opcional, en **Settings → General → Pull Requests:** permitir solo squash merge y activar "Automatically delete head branches".
