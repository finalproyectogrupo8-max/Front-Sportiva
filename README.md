# Sportiva — Gestión operativa de clubes deportivos

Panel para la operación diaria de un club: jugadores, profes, partidos con convocatoria y asistencia, habilitación ante la liga, materiales, indumentaria, canchas, comunicados, análisis y proyecto deportivo. Cada club tiene su propio espacio y sus propios datos.

Este repositorio es **solo el frontend**. Consume la **API REST en Laravel** ([API_Sportiva](https://github.com/finalproyectogrupo8-max/API_Sportiva)), que es dueña de la lógica de negocio, la persistencia, los permisos y la autenticación.

Hecho con **Next.js 16** (App Router + Turbopack), **React 19**, **TypeScript**, **Tailwind CSS 4** y **shadcn/ui**.

> **Estado:** todos los módulos van contra la API. No quedan datos de ejemplo en el front.

| Para… | Leé |
| --- | --- |
| Usar la app, paso a paso por rol | [docs/manual/](docs/manual/README.md) |
| Cómo funciona cada pantalla y por qué | [docs/guia-de-uso.md](docs/guia-de-uso.md) |
| Entender cómo está armado el front: sesión, carpetas, cómo sumar un endpoint, design system | [docs/arquitectura-front.md](docs/arquitectura-front.md) |
| Login, tokens y contrato con Laravel | [docs/integracion-api-laravel.md](docs/integracion-api-laravel.md) |
| Decisiones de producto y pendientes | [docs/decisiones-producto.md](docs/decisiones-producto.md) |
| CI | [docs/ci.md](docs/ci.md) |

---

## 1. Correr la app en local

El front no funciona solo: necesita la API corriendo. Son cuatro pasos y en una hora tenés todo andando.

> **¿Querés instalar todo de una?** En Windows, un script instala WSL, Docker, la API y este front, y los levanta con datos de demo. Si preferís hacerlo a mano, o estás en Linux o macOS, está el paso a paso completo. Las dos opciones están en la [guía de instalación](https://github.com/finalproyectogrupo8-max/API_Sportiva/blob/main/docs/instalacion.md).

### Requisitos previos

| Herramienta | Versión | Cómo verificarla |
| --- | --- | --- |
| Node.js | 20.9 o superior (probado con 24) | `node -v` |
| pnpm | 12.x | `pnpm -v` |
| Docker Desktop | con WSL 2 en Windows | `docker compose version` |
| Git | cualquier versión reciente | `git --version` |

Si no tenés pnpm: `corepack enable` (viene con Node y usa la versión fijada en `package.json`).

> Usá **solo pnpm**. `npm install` o `yarn` ignoran `pnpm-lock.yaml` y generan otro lockfile.

### Paso 1: la API

Cloná [API_Sportiva](https://github.com/finalproyectogrupo8-max/API_Sportiva) **al lado de este repo** (por ejemplo `~/repos/api-sportiva` y `~/repos/gestion-operativa-club-deportivo`): `pnpm api:types` la busca en `../api-sportiva`.

Seguí su guía [docs/desarrollo-local.md](https://github.com/finalproyectogrupo8-max/API_Sportiva/blob/main/docs/desarrollo-local.md). En resumen, dentro del repo de la API:

```bash
cp .env.example .env
docker compose up -d --wait                       # API en :8000, MySQL, cola y Mailpit
docker compose exec backend php artisan migrate --seed
```

El seed crea dos usuarios:

| Email | Contraseña | Qué es |
| --- | --- | --- |
| `admin@sportiva.com` | `admin123` | Admin de plataforma: entra a `/admin` |
| `general@sportiva.com` | `general123` | Usuario común, sin clubes todavía |

Los mails que manda la API (recuperar contraseña, convocatorias, comunicados) no salen a internet: se ven en **Mailpit**, <http://localhost:8025>.

### Paso 2: el front

Automático (instala Node 24 y pnpm si faltan, crea el `.env.local`, instala dependencias y levanta la app):

```bash
git clone https://github.com/finalproyectogrupo8-max/Front-Sportiva.git gestion-operativa-club-deportivo
cd gestion-operativa-club-deportivo
bash scripts/setup.sh
```

A mano, si preferís tener el control:

```bash
cp .env.example .env.local        # API_URL=http://127.0.0.1:8000/api
pnpm install --frozen-lockfile
pnpm dev                          # http://localhost:3000
```

En el `.env` de la API, `FRONTEND_URL` tiene que apuntar a esta URL (los links de los mails la usan).

### Paso 3: entrar

La API ya viene con datos de demo: un club **Demo Sportiva** con jugadores, partidos, stock y pedidos. El detalle de todas las cuentas está en `docs/datos-demo.md` del repo de la API.

1. Entrá a <http://localhost:3000/login> con `admin.club@sportiva.com` / `demo1234`: sos el administrador del club demo y entrás directo a `/c/demo`. Para el panel de plataforma, usá `admin@sportiva.com` / `admin123`.
2. Si querés crear otro club: **Clubes → Nuevo club** con `admin@sportiva.com`.
2. **Clubes → Nuevo club:** nombre, slug (por ejemplo `club_demo`) y su administrador inicial. La base del club se crea en segundo plano (la cola corre en Docker): esperá a que diga **Activo**.
3. Cerrá sesión y entrá con el administrador del club que cargaste. Llegás a `/c/club_demo`.
4. La guía "Configurar club" (arriba a la derecha) te lleva por los primeros pasos: deporte, temporada y categorías. Después, jugadores y partidos.

### Scripts

| Comando | Qué hace |
| --- | --- |
| `bash scripts/setup.sh` | Deja el front listo desde cero: Node 24, pnpm, `.env.local`, dependencias y servidor. Se puede correr siempre |
| `pnpm dev` | Servidor de desarrollo con hot reload (puerto 3000; otro con `pnpm dev --port 3125`) |
| `pnpm build` / `pnpm start` | Build de producción y servirlo |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit`. **`pnpm build` no falla por tipos** (`ignoreBuildErrors`): corré esto antes del PR |
| `pnpm api:types` | Regenera `lib/api/schema.d.ts` desde `../api-sportiva/docs/api/openapi.json` (o `API_OPENAPI=/ruta pnpm api:types`) |

### Variables de entorno

| Variable | Ejemplo | Notas |
| --- | --- | --- |
| `API_URL` | `http://127.0.0.1:8000/api` | URL base de la API, con `/api`. **Solo de servidor**: nunca `NEXT_PUBLIC_` |

Los valores locales van en `.env.local`, que no se commitea. Cada variable nueva se documenta acá y se suma a `.env.example`. Una variable `NEXT_PUBLIC_` viaja al browser: **nunca** secretos ahí.

### Problemas comunes

| Síntoma | Qué hacer |
| --- | --- |
| El login dice que no se puede conectar | La API no está arriba: `docker compose ps` en el repo de la API |
| El club queda en "Aprovisionando" | La cola no corre: `docker compose ps queue`; si está, mirá `docker compose logs queue` |
| No llega un mail | Está en Mailpit (<http://localhost:8025>). Si tampoco, reiniciá la cola: `php artisan queue:restart` |
| Errores de tipos después de un pull de la API | `pnpm api:types` |
| Errores raros después de un pull | `pnpm install`; si sigue, borrá `.next/` y reiniciá `pnpm dev` |
| `EPROTO: The TLS handshake failed` o `ERR_SSL_PROTOCOL_ERROR` | Estás abriendo con `https://` un puerto local que habla HTTP. Usá `http://127.0.0.1:3000`, y revisá que `API_URL` en `.env.local` empiece con `http://` (volver a correr `bash scripts/setup.sh` lo corrige) |
| Puerto 3000 ocupado | `pnpm dev --port 3001` (y actualizá `FRONTEND_URL` en la API) |

---

## 2. Estructura del proyecto

```
app/
  (marketing)/          Sitio público: inicio, funciones, quiénes somos, contacto
  (app)/                La aplicación (sesión, sin estilos de marketing)
    login/ recuperar-contrasena/ restablecer-contrasena/ sesion-expirada/
    clubes/             Elegir club
    perfil/             Mi perfil (cualquier usuario)
    admin/              Panel de plataforma: clubes, usuarios, tickets
    c/[club]/           Un club: inicio y un directorio por módulo
                        (partidos, jugadores, habilitacion, analisis, competencia,
                         profes, indumentaria, materiales, canchas, comunicados,
                         equipo, configuracion), cada uno con page.tsx y actions.ts
    convocatoria/       Página pública de la convocatoria (familias, sin login)
components/
  ui/                   Base de shadcn/ui (no se editan a mano salvo ajustes del tema)
  club/                 Pantallas del club, una carpeta por módulo, más shared.tsx y forms.tsx
  admin/  marketing/  auth/  brand/  callup/  contact/  profile/
lib/
  api/                  client.ts (apiFetch) + un archivo por módulo; schema.d.ts generado
  session.ts auth.ts    Leer y escribir la sesión
  action-result.ts      Resultado de las server actions (runApiAction)
  modules.ts            Módulos del club, sus íconos y qué permiso los habilita
proxy.ts                Gate optimista: sin cookie, al login
docs/                   Guía de uso, arquitectura, integración con la API, decisiones, CI, ADRs
```

`AGENTS.md` y `CLAUDE.md` los genera `next dev`: son instrucciones para asistentes de código y se commitean.

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
- [ ] Probaste el cambio a mano en el browser (`pnpm dev`), en escritorio y en celular.
- [ ] Nada de datos de ejemplo: todo sale de la API, y lo que todavía no existe muestra un estado vacío.
- [ ] Si cambió el contrato de la API, corriste `pnpm api:types` y commiteaste `lib/api/schema.d.ts`.
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
2. Entrar con un usuario del seed (ver la sección 1)
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
