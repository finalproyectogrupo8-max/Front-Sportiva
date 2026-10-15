# CI: integración continua

Cada pull request a `main` se verifica automáticamente en GitHub Actions antes de poder mergearse. Este documento explica qué se verifica, por qué, cómo resolver un check en rojo y qué decisiones se tomaron al armarlo.

## 1. Por qué tenemos CI

Somos 4 personas integrando en `main`. Cada PR se mezcla con el trabajo de los demás, y sin un chequeo automático pasa lo siguiente:

- El que revisa tendría que bajarse el branch y correr todo a mano. En la práctica, nadie lo hace.
- Los errores aparecen **después** del merge, cuando `main` ya está roto para los otros tres.

La CI corre los mismos chequeos en una máquina limpia para cada PR. Así, "en mi máquina anda" deja de ser un argumento: el código tiene que andar en una máquina que no tiene nada de nadie.

> **CI vs. CD**
> - **CI** (integración continua) verifica que el código que se integra esté bien.
> - **CD** (despliegue continuo) despliega automáticamente lo que ya se integró.
>
> Por ahora solo tenemos CI (ver [sección 7](#7-próximos-pasos)).

## 2. Qué corre y cuándo

El workflow es [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Corre:

- en cada **pull request** contra `main`, y cada vez que se pushea un commit nuevo a ese PR;
- en cada **push a `main`**, o sea después de cada merge, para confirmar que `main` sigue sano.

Tiene un solo job, `verify`, con estos pasos en orden. Si uno falla, los siguientes no corren.

| Paso | Comando | Qué detecta |
| --- | --- | --- |
| Instalación | `pnpm install --frozen-lockfile` | Un `pnpm-lock.yaml` que no coincide con `package.json` (alguien agregó una dependencia y no commiteó el lockfile) |
| Lint | `pnpm lint` | Errores comunes de React, Next.js y TypeScript: hooks mal usados, imports rotos, `<img>` en lugar de `next/image`, etc. |
| Typecheck | `pnpm typecheck` | Errores de tipos |
| Build | `pnpm build` | Cualquier cosa que impida compilar la app para producción |

### Por qué el typecheck va aparte del build

`next.config.mjs` tiene `typescript.ignoreBuildErrors: true`, así que `pnpm build` **termina bien aunque haya errores de tipos**. Sin el paso de typecheck, un error de tipos llegaría a `main` sin que nadie se entere. Esto se probó: con un error de tipos agregado a propósito, `build` pasa y `typecheck` falla.

## 3. Correr lo mismo en local

Antes de pushear, podés correr exactamente lo mismo que la CI:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

| Script | Qué hace |
| --- | --- |
| `pnpm lint` | `eslint .` con la configuración de [`eslint.config.mjs`](../eslint.config.mjs) |
| `pnpm typecheck` | `next typegen && tsc --noEmit`: primero genera los tipos de Next.js y después chequea los tipos sin generar archivos |
| `pnpm build` | Build de producción |

Si los tres pasan en local, casi seguro pasan en la CI.

## 4. Qué hacer si el check está en rojo

1. En el PR, en la sección de checks, hacé click en **Details** al lado de `verify`.
2. Abrí el paso que falló (tiene una ✗) y leé el error. Generalmente indica archivo y línea.
3. Reproducilo en local con el mismo comando de la tabla de la sección 2.
4. Corregilo en tu branch, commiteá y pusheá. La CI vuelve a correr sola; no hace falta cerrar ni reabrir el PR.

Errores frecuentes:

| Paso que falla | Causa probable | Solución |
| --- | --- | --- |
| Instalación | Cambiaste `package.json` y no commiteaste `pnpm-lock.yaml` | Corré `pnpm install` y commiteá el lockfile |
| Instalación | Instalaste con `npm` o `yarn` | Borrá el lockfile que generaron, corré `pnpm install` y commiteá `pnpm-lock.yaml` |
| Lint | Una regla de ESLint | Leé el nombre de la regla en el error; muchas se arreglan con `pnpm lint --fix` |
| Typecheck | Error de tipos | Corré `pnpm typecheck` en local; VS Code también los marca en rojo |
| Build | Error de compilación o de prerender | Corré `pnpm build` en local y leé el primer error |

> No desactives una regla de ESLint ni uses `// @ts-ignore` para que pase la CI sin entender el error. Si una regla no tiene sentido para el proyecto, se discute en un PR que cambie `eslint.config.mjs`, para que lo decida el equipo.

## 5. Protección de `main`

La CI por sí sola **avisa** pero no **bloquea**: un PR con ✗ se puede mergear igual. Para que bloquee, el dueño del repositorio tiene que configurar una regla sobre `main`.

### Quién puede configurarla

Solo alguien con permiso de **admin** sobre el repo. Este repo es de una **cuenta personal**, así que solo el dueño puede hacerlo. Los colaboradores tienen permiso de escritura, que no alcanza para cambiar la configuración.

### Requisito de plan

En repos **privados**, la protección de branches y la revisión obligatoria solo funcionan con **GitHub Pro** o superior ([GitHub's plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)). Con el plan Free hay tres opciones:

| Opción | Consecuencia |
| --- | --- |
| El dueño activa GitHub Pro | La regla bloquea de verdad. Para estudiantes, el [GitHub Student Developer Pack](https://education.github.com/pack) incluye Pro gratis |
| Hacer el repo público | La regla funciona con Free, pero el código queda visible para cualquiera |
| Acuerdo de equipo | Nadie mergea con ✗ ni sin aprobación. Funciona mientras todos lo respeten; GitHub no lo impide |

### Cómo configurarla

**Settings → Rules → Rulesets → New ruleset → New branch ruleset**:

- **Enforcement status:** Active.
- **Target branches:** Include default branch (`main`).
- Reglas:
  - **Restrict deletions:** nadie puede borrar `main`.
  - **Block force pushes:** nadie puede reescribir la historia de `main`.
  - **Require a pull request before merging:** 1 aprobación como mínimo. Conviene activar también:
    - "Dismiss stale pull request approvals when new commits are pushed": si cambia el código, la aprobación vieja ya no vale.
    - "Require conversation resolution before merging": no se mergea con comentarios sin resolver.
  - **Require status checks to pass:** agregar `verify`. El check recién aparece en la lista después de que la CI corrió al menos una vez, así que primero hay que mergear o abrir un PR con el workflow.

## 6. Decisiones técnicas

Estas decisiones explican cosas del setup que no son obvias al leer los archivos.

### Acciones y entorno

| Decisión | Por qué |
| --- | --- |
| `pnpm/setup@v3` en lugar de `actions/setup-node` + `pnpm/action-setup` | Es la action recomendada actualmente por pnpm: instala pnpm, Node.js y las dependencias en un solo paso, y verifica la firma del binario de pnpm |
| La versión de pnpm sale de `packageManager` en `package.json` | Todos (local y CI) usan la misma versión sin repetirla en el workflow |
| `require-lockfile: true` | Equivale a `pnpm install --frozen-lockfile`: la CI nunca modifica el lockfile, solo verifica que esté al día |
| `runtime: node@24` | Es la versión con la que se prueba el proyecto (README, requisitos previos) |
| `cache: true` | Reutiliza el store de pnpm entre corridas; la instalación tarda menos |
| `permissions: contents: read` | Mínimo privilegio: el workflow solo lee el código. Si una dependencia comprometida corriera algo en la CI, no podría escribir en el repo |
| `concurrency` con `cancel-in-progress` | Si pusheás dos veces seguidas al mismo PR, se cancela la corrida vieja y solo cuenta la última |
| `timeout-minutes: 15` | Si algo se cuelga, el job no consume minutos de Actions indefinidamente |

### ESLint

| Decisión | Por qué |
| --- | --- |
| ESLint 9 y no 10 | Los plugins que trae `eslint-config-next` (react, jsx-a11y, import) todavía declaran compatibilidad hasta ESLint 9. Con la 10, pnpm reporta peer dependencies incompatibles |
| `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` | Es la configuración recomendada por la documentación de Next.js 16 para proyectos TypeScript |
| `eslint .` en lugar de `next lint` | `next lint` se eliminó en Next.js 16 |

### `next-env.d.ts` fuera de Git

Next.js genera `next-env.d.ts` automáticamente, y su contenido cambia entre `next dev` y `next build`. Si estuviera versionado, aparecería modificado en casi todos los PRs sin que nadie lo haya tocado. La documentación de Next.js 16 indica agregarlo a `.gitignore` y sacarlo de Git, y eso se hizo.

Como en la CI ese archivo no existe al momento del typecheck, el script `typecheck` corre primero `next typegen`, que lo genera junto con los tipos de las rutas.

### Script de instalación de `unrs-resolver` denegado

`unrs-resolver` es una dependencia de ESLint que trae un script de instalación. Ese script solo verifica que esté su binario nativo, que ya viene precompilado para cada sistema operativo, así que no hace falta.

Desde pnpm 10, los scripts de instalación de dependencias no corren salvo que se aprueben explícitamente. Es una protección contra ataques a la cadena de suministro: una dependencia maliciosa podría ejecutar código al instalarse. En pnpm 12, además, un script sin decisión explícita **hace fallar la instalación**. Por eso `pnpm-workspace.yaml` tiene:

```yaml
allowBuilds:
  unrs-resolver: false
```

Si al agregar una dependencia aparece el error `ERR_PNPM_IGNORED_BUILDS`:

1. Averiguá qué hace el script de ese paquete.
2. Decidí si permitirlo (`pnpm approve-builds <paquete>`) o denegarlo (`pnpm approve-builds '!<paquete>'`).
3. Commiteá el cambio de `pnpm-workspace.yaml`.

Nunca uses `--all` sin revisar qué se está aprobando.

## 7. Próximos pasos

| Etapa | Qué agrega | Cuándo |
| --- | --- | --- |
| Tests unitarios | **Vitest** para la lógica: el cliente API (cómo mapea 401, 403 y 422) y la sesión | Al empezar la integración con la API de Laravel |
| Tests end-to-end | **Playwright** para los flujos críticos: login, elegir club, logout | Cuando el login real esté conectado |
| Preview deploys | Una URL por PR para ver el cambio funcionando antes de aprobarlo | Cuando se decida el hosting |
| CD a producción | Deploy automático al mergear a `main` | Cuando se decida el hosting |

Los tests se agregan como pasos nuevos del job `verify` (o como jobs aparte), y quedan cubiertos por la misma regla de protección.

La API de Laravel vive en otro repo y necesita su propia CI (PHPUnit o Pest). Esta CI cubre solo el frontend.
