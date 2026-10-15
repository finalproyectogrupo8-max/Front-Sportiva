# ADR 0002 — Hosting: Vercel para el frontend y Laravel Cloud para la API

- **Estado:** Propuesto (falta la confirmación del equipo)
- **Fecha:** 2026-10-15
- **Relacionado:** [ADR 0001](0001-frontend-api-integration.md) (integración BFF, tenant atado al token, una base de datos por club)

## Contexto

- El frontend es Next.js 16 y tiene que correr como servidor (sin static export), según el ADR 0001.
- La API es Laravel y usa una base central (`olim_platform`) más **una base MySQL por club**.
- Cada request hace un salto extra (browser → Next.js → Laravel), así que el frontend y la API tienen que estar cerca.
- El equipo son 4 devs con un producto que entregar. No queremos administrar servidores, certificados ni bases de datos.

La duda principal era si Laravel Cloud permite el modelo de una base por club: un entorno de Laravel Cloud se conecta a **una sola** base (`DB_DATABASE`).

## Decisión

- **Frontend:** Vercel.
- **API y bases de datos:** Laravel Cloud, con un cluster de Laravel MySQL.
- **Bases de datos:**
  - el entorno de Laravel Cloud se conecta a la base **general** (`olim_platform`);
  - las bases de los clubes viven **en el mismo cluster** y la API las abre con una segunda conexión (`tenant`), usando el mismo host y usuario;
  - las bases de los clubes **no** se conectan al entorno desde el dashboard.
- **Región:** el frontend (las funciones de Vercel) y la API van en la misma región.
- **Docker:** no se usa para el deploy. Ninguna de las dos plataformas acepta imágenes propias: las dos compilan desde el repositorio de Git.

## Evidencia: prueba en Laravel Cloud

El 2026-10-15 se probó sobre la app de ejemplo `mini-api-laravel`: cluster `mini_api_laravel` (Laravel MySQL 8.4, Flex, US East), con la base `production` conectada al entorno. Se usó el public endpoint con DBeaver, y el usuario por defecto del cluster.

| Prueba | Resultado |
| --- | --- |
| `CREATE DATABASE club_test` | ✅ Funciona: la app puede crear bases en tiempo de ejecución |
| `CREATE TABLE club_demo.prueba`, `INSERT` y `SELECT` estando conectado a `production` | ✅ Funciona: `information_schema.tables` confirma que la tabla quedó en `club_demo` |
| Las bases creadas por SQL aparecen en el dashboard | ✅ Laravel Cloud muestra todas las bases del cluster, sin registrarlas aparte |
| `USE club_demo` | ❌ Lo rechaza el proxy de Laravel Cloud (`SQL Error 1148: Unable to parse`) |

**Conclusión:** el modelo de una base por club funciona en Laravel Cloud, y el alta de clubes se puede automatizar.

Que `USE` falle no afecta a la API. Laravel no cambia de base con `USE`: reconfigura la conexión y abre una conexión nueva con la base indicada en el DSN. La API **no debe** usar `USE` ni `DB::statement('USE ...')`.

**Pendiente de verificar:** la conexión directa desde Laravel/PDO con `dbname=club_xxx`. Es la forma exacta en que la API cambia de base, y se verifica en la primera prueba de la conexión `tenant`. Con los permisos ya comprobados, se espera que funcione.

## Alternativas consideradas

| Alternativa | Por qué no |
| --- | --- |
| **Todo en Laravel Cloud** (también aloja Next.js) | Resuelve la región con un solo proveedor, pero se pierden las previews por PR de Vercel, que funcionan sin configurar nada. En Laravel Cloud, los entornos de preview recién están en el plan Growth. Es el plan B si la latencia entre proveedores resulta un problema. |
| **VPS con Docker** | Control total y bajo costo, pero el equipo tendría que operar el servidor, los certificados, los backups y las actualizaciones. Es demasiado trabajo para 4 devs con un producto que entregar. |
| **AWS (ECS, RDS, etc.)** | Muy flexible, pero exige mucha configuración (red, IAM, IaC) y el costo hay que vigilarlo de cerca. No se justifica para este proyecto. |
| **Una sola base con columna `tenant_id`** (multi-tenancy por filas) | Era el plan B si Laravel Cloud no permitía varias bases. La prueba mostró que no hace falta, y el modelo de datos ya está diseñado con una base por club. |

## Consecuencias

### Positivas

- Deploy con cada push y sin infraestructura propia.
- Vercel genera una preview por cada PR del frontend, lo que facilita revisar cambios de UI.
- Bajo costo con poco tráfico: Laravel Cloud Starter cuesta US$5/mes con US$5 de uso incluido, y la base Flex y el cómputo se apagan cuando no hay tráfico ([precios](https://laravel.com/cloud/docs/pricing.md)).
- Poco lock-in: Next.js y Laravel estándar, sin APIs propietarias en el código.

### Negativas y riesgos

| Riesgo | Mitigación |
| --- | --- |
| **Latencia entre proveedores:** el tráfico Vercel → Laravel Cloud va por internet público | La misma región para los dos; evitar varias llamadas encadenadas a la API por página |
| **Arranque en frío:** la base Flex y el cómputo se apagan por inactividad, y la primera consulta tarda más | Aceptable en desarrollo. Antes de una demo, hacer un request previo para despertarlos |
| **Migraciones por club:** una migración nueva tiene que aplicarse en **todas** las bases de los clubes | Comando `tenants:migrate` en los deploy commands, migraciones compatibles hacia atrás. Ver [integración, sección 5.6](../integracion-api-laravel.md#56-bases-de-datos-por-club) |
| **Permisos amplios:** el usuario por defecto puede crear (y presumiblemente borrar) bases en todo el cluster, así que un SQL injection tiene un impacto alto | Separar usuarios: uno *Read-write* para la operación normal y otro con permisos de creación, solo para el comando de alta de clubes. A definir al construir la API |
| **El selector de base del entorno:** si alguien elige una base de club ahí, reemplaza a la general como `DB_DATABASE` | Documentado: las bases de los clubes nunca se eligen en ese selector |
| **Plan de Vercel:** el plan Hobby es para uso personal y no comercial, y no admite equipos | Para un proyecto académico alcanza Hobby, con una persona dueña del deploy. **Revisar los términos vigentes de Vercel antes de confirmar** (no verificado en este ADR) |

## Configuración pendiente

- [ ] Elegir la región. Verificar si las dos plataformas ofrecen São Paulo, que está más cerca de usuarios en Argentina; si no, usar las dos en US East.
- [ ] Crear un entorno `staging` en Laravel Cloud para la API, al que apunten las previews de Vercel (con su propio `API_URL`).
- [ ] Configurar `API_URL` en Vercel, por entorno (Preview y Production).
- [ ] Laravel Cloud despliega en cada push por defecto. El repo de la API tiene que tener su propia CI, y el deploy se dispara con un *deploy hook* solo cuando los tests pasan.
- [ ] Decidir si se usa un paquete de multi-tenancy (por ejemplo `stancl/tenancy`) o una implementación propia. Va en un ADR del repo de la API.
- [ ] Al terminar la prueba: borrar `club_demo` y `club_test`, y desactivar el public endpoint del cluster de prueba.
