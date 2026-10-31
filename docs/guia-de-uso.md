# Guía de uso de Sportiva

Cómo se usa el sistema hoy, pantalla por pantalla: qué hace cada módulo, dónde está y en qué orden conviene cargar las cosas. Las decisiones de producto y lo que queda pendiente están en [decisiones-producto.md](decisiones-producto.md).

> Actualizada al 31/10/2026 (versión 1.0.0). Si cambia una pantalla, actualizá su sección en el mismo PR.

---

## 1. El recorrido en una línea

**Configurar el club → cargar jugadores y profes → cargar los papeles (habilitación) → cargar el partido → convocar y compartir por WhatsApp → las familias confirman → tomar asistencia → cargar el resultado.**

Cada paso usa lo que se cargó en el anterior. Por ejemplo, para convocar a un jugador hace falta que esté en la categoría del partido y que tenga los papeles aprobados.

---

## 2. Entrar y moverse

| Qué | Dónde |
|---|---|
| Iniciar sesión | `/login` con email y contraseña |
| Elegir club (si tenés más de uno) | `/clubes`, o el selector con el nombre del club arriba a la izquierda |
| Cambiar de módulo | El selector con el nombre del módulo, al lado del club |
| Buscar o crear rápido | **Ctrl + K** (o el buscador de arriba) y el botón **Crear** |
| Tema claro u oscuro | El ícono de luna o sol, arriba a la derecha |
| Configuración del club | En el menú de módulos, la opción **Configuración** |

Cada persona ve solo los módulos que permiten sus roles. El profe ve solo sus categorías.

**Pie de página:** muestra la versión del sistema, el commit y la fecha de la última actualización. En desarrollo aparece la etiqueta "Desarrollo".

**Banner "Modo Demo":** hay módulos que todavía muestran datos de ejemplo (ver [sección 11](#11-qué-todavía-es-de-ejemplo)).

---

## 3. Configuración del club

**Dónde:** menú de módulos → **Configuración** (`/c/<club>/configuracion`). Tiene una pestaña por tema.

### Guía de primeros pasos

Mientras falten deportes, temporadas o categorías, en la barra de arriba aparece el botón **Configurar club 0/3**. Muestra los pasos que faltan y lleva a cada pestaña. La primera vez que entrás se abre solo. Cuando completás los tres pasos, desaparece.

### Orden recomendado

1. **Perfil:** nombre, sigla, ciudad, año de fundación, color del club (en hexadecimal, por ejemplo `#1d4ed8`) y escudo.
   - Para el escudo, tocá **Subir escudo**.
   - El color y el escudo se usan en la barra y en las páginas públicas de la convocatoria.
2. **Sedes:** las direcciones donde el club juega de local (sede principal, un parque deportivo, otra cancha).
   - Tocá **Nueva sede**, poné el nombre y escribí la dirección.
   - Elegí una de las sugerencias: el mapa muestra el punto para confirmar.
   - El link de Google Maps se arma solo.
   - Una sede con partidos programados no se puede borrar. Se puede desactivar (sin tildar **Activa**, deja de aparecer al cargar un partido).
3. **Deportes:** **Nuevo deporte** (fútbol, básquet, hockey…).
4. **Temporadas:** **Nueva temporada** con nombre (por ejemplo `2027 - primera mitad`), inicio, fin y estado.
   - Estados: **En curso**, **Planificada** o **Cerrada**.
   - La que está "En curso" es la temporada actual.
5. **Categorías:** **Nueva categoría** con deporte, temporada, nombre y edades (desde y hasta).
   - Cada categoría pertenece a **una** temporada. Para el año siguiente se crean de nuevo.
   - Se puede filtrar por deporte y temporada.
6. **Competencias:** las ligas o torneos que juega el club. Tocá **Nueva competencia** y completá:
   - deporte, temporada, nombre, quién la organiza y cierre de inscripción;
   - **las categorías que la juegan**;
   - **los requisitos (papeles)** que pide. Cada uno tiene nombre, si vence (cada cuántos meses), si **pide archivo**, si es **solo para menores** y si es **obligatorio**. Se reordenan arrastrando o con las flechas.
   - Atajo: al lado de **Agregar requisito** aparecen los requisitos típicos (Apto médico, Ficha de inscripción firmada, Copia del DNI, Autorización de los padres) para sumarlos de un toque.
   - **Copiar a otra temporada:** copia los datos y los requisitos. Las categorías no se copian, porque son de otra temporada, y se eligen después.

### Ejemplo: Sub 21 femenino y masculino para "2027 - primera mitad"

1. **Temporadas:** crear `2027 - primera mitad` (por ejemplo del 01/01/2027 al 30/06/2027).
2. **Categorías:** crear `Sub 21 femenino` y `Sub 21 masculino`, las dos con el mismo deporte, esa temporada y edades de 18 a 21.
3. **Competencias:**
   - si las dos ramas juegan la misma liga con los mismos papeles, alcanza con **una** competencia que tenga marcadas las dos categorías;
   - si son ligas distintas, se crean dos competencias.
4. **Jugadores:** en la ficha de cada jugador, sumarlo a su Sub 21 de 2027.

Hoy no hay un campo de rama: femenino y masculino se distinguen por el nombre. Está planificado en TIZ-40 y FRO-40.

---

## 4. Jugadores

**Dónde:** módulo **Jugadores** (`/c/<club>/jugadores`).

- **Listado:** buscador (nombre, DNI o número de ficha) y filtros por **Categoría** y **Estado**. Cada fila muestra la foto, la categoría, el puesto, la edad y el estado.
- **Nueva ficha de jugador:** nombre, apellido, DNI, fecha de nacimiento, número de ficha federativa, puesto, perfil hábil, categoría y número de camiseta, estado y notas para el cuerpo técnico.
  - En las notas no va nada médico: eso va en sus papeles.
- **Ficha del jugador:** tocá **Abrir** en la fila. Se abre un panel con:
  - **Foto:** en el celular abre la cámara o la galería.
  - **Datos:** se editan con **Editar**.
  - **Contactos de la familia:** nombre, vínculo, celular y email. Uno se marca como **Principal**: es al que se le manda el WhatsApp personal de la convocatoria.
  - **Categorías:** en cuáles juega, con su número.
    - **Agregar** lo suma a otra categoría.
    - Si ya juega en otra categoría del **mismo deporte**, es un **pase**: al confirmar sale de la anterior.
  - **Habilitación:** si está habilitado para cada competencia y qué papeles le faltan, con un link a **Ver en el tablero**.
  - **Historial** de categorías.
  - **Dar de baja la ficha**, para cuando deja el club.

El jugador no tiene un deporte propio: su deporte es el de sus categorías.

---

## 5. Profes

**Dónde:** módulo **Profes** (`/c/<club>/profes`).

- **Nuevo profe:** nombre, apellido, celular, email y estado. Las categorías se asignan después, desde su ficha.
- **Ficha del profe:** contacto y **Categorías a cargo**. Con **Asignar categoría** se elige la categoría y el rol en ella (**Profe a cargo**, **Ayudante** o **Preparador físico**).
- Un profe con usuario en el sistema ve solo sus categorías: jugadores, partidos, habilitación y convocatorias.

---

## 6. Habilitación (papeles)

**Dónde:** módulo **Habilitación** (`/c/<club>/habilitacion`).

Responde **quién puede jugar** y **qué papeles le faltan a cada uno**, según los requisitos de las competencias de su categoría.

1. **Tarjetas por categoría:** cuántos jugadores tiene, cuántos están habilitados y cuánto falta para el cierre de inscripción más próximo.
2. **Tablero de la categoría:** una fila por jugador y una columna por requisito.
   - Cada celda muestra el estado del papel: aprobado, presentado, rechazado, falta o vence pronto.
   - "No aplica" aparece, por ejemplo, en la autorización de los padres para un mayor de edad.
   - Hay buscador y referencias de colores.
3. **Tocá una celda** para abrir el papel:
   - **Presentar:** subir el archivo (PDF o foto del celular, hasta 10 MB) y, si vence, la fecha de vencimiento.
   - **Aprobar** o **Rechazar** con el motivo. Lo hacen el coordinador o el administrador.
   - **Ver archivo** para revisar lo que se subió.

Un jugador está **habilitado** cuando tiene aprobados todos los papeles obligatorios de las competencias de su categoría. Si la categoría no juega ninguna competencia, no tiene requisitos para mostrar.

---

## 7. Partidos y entrenamientos

**Dónde:** módulo **Partidos** (`/c/<club>/partidos`).

### Calendario

- Vista **Semana** o **Mes**, flechas para moverse, botón **Hoy** y filtro por **Categoría**.
- Cada partido muestra la hora, la categoría, el rival y el lugar. Tocalo para abrir su página.
- Los entrenamientos se abren en un panel lateral, con **Editar**, **Eliminar** y **Tomar asistencia**.

### Cargar un partido

Botón **Nuevo partido** (también desde **Crear** o Ctrl + K):

- **Categoría** y **Competencia** (solo las de esa categoría).
- **Rival**, **Día y hora del partido** y **Presentación** (tiene que ser antes del partido).
- **Condición:**
  - **Local:** se elige una **Sede** del club y el lugar y el link de Maps se completan solos.
  - **Visitante:** se busca la dirección del rival con sugerencias y mapa.
- **Camiseta** (titular o alternativa) y **Color**.
- **Qué llevar**, que lo ven los jugadores.
- **Notas internas**, que ve solo el cuerpo técnico.

### Cargar un entrenamiento

Botón **Entrenamiento**: categoría, día, hora de inicio y de fin, lugar, objetivos y notas.

### Página del partido

`/c/<club>/partidos/<id>`:

- **Encabezado:** rival, día, presentación (destacada), hora del partido, camiseta, lugar con **Cómo llegar**, qué llevar y el mapa.
- **Convocatoria:** la sección principal (ver la [sección 8](#8-convocatoria)).
- **Asistencia:** tarjeta con los presentes. El botón abre un **panel lateral** para tomarla (ver la [sección 9](#9-asistencia)).
- **Resultado:** estado (**Programado**, **Jugado**, **Postergado** o **Suspendido**) y, si se jugó, los goles o puntos de cada equipo.
- **Notas internas**, **Editar datos** y **Eliminar**.

Las horas se muestran siempre en hora argentina.

---

## 8. Convocatoria

**Dónde:** página del partido → sección **Convocatoria**.

### Armarla

1. Lista del plantel de la categoría:
   - los **habilitados** tienen casilla para tildar;
   - los **no habilitados** aparecen en gris con los papeles que les faltan y no se pueden convocar.
2. Tildá a los convocados o tocá **Todos los habilitados**.
3. Ajustá los **números de camiseta** si hace falta. Vienen del plantel y no se pueden repetir.
4. **Guardar** deja la lista sin avisar a nadie. **Guardar y publicar** la deja lista para compartir.

### Compartirla

- **Compartir en el grupo:** abre WhatsApp con el mensaje armado para pegar en el grupo de la categoría. El mensaje incluye:
  - club, categoría y rival;
  - día, presentación, hora del partido y lugar con link de Maps;
  - camiseta y qué llevar;
  - **la lista de convocados**;
  - el link: "👉 Tocá tu nombre y confirmá si vas".
- **Copiar link:** el mismo link, para pegarlo donde quieras.
- **¿Prefieren votar en una encuesta de WhatsApp?** Muestra los pasos y la pregunta lista para copiar. WhatsApp no deja que el sistema cree la encuesta, así que se arma a mano. Las respuestas de una encuesta quedan solo en WhatsApp.

### Ver quién va

- Contadores **Van / No pueden / Sin respuesta**. Al tocar uno, la lista se filtra.
- Cada convocado aparece con su respuesta y, si no puede, **el motivo**, que solo ve el profe.
- **Actualizar** trae las respuestas nuevas.
- **Recordar a los que no respondieron:** filtra a los que faltan. El botón verde de cada uno manda **por WhatsApp privado** a su contacto principal un mensaje con su link personal. Si no tiene teléfono, el botón de copiar copia su link.
- **Editar convocados** vuelve a la lista para sumar o sacar jugadores.

Si se cambia la fecha, la hora o el lugar del partido después de publicar, aparece **"Hubo cambios: volvé a avisar"**. **Actualizar mensaje** rearma el texto para mandarlo de nuevo.

El utilero ve la convocatoria en modo lectura, para preparar las camisetas.

---

## 9. Asistencia

**Dónde:** página del partido → tarjeta **Asistencia** → **Tomar asistencia**. Se abre un panel lateral. En los entrenamientos se toma desde su panel en el calendario.

- Arriba: presentes sobre el total, una barra de colores y contadores de **Presente**, **Tarde**, **Justificado** y **Ausente**.
- **Todos presentes** marca a todos de una vez. Después corregís a los que faltaron.
- **Tocar el nombre** pasa de presente a ausente. Los botones **P · T · J · A** de cada fila marcan cualquier estado.
- Con más de 8 jugadores aparece un buscador.
- **Guardar asistencia** queda fijo abajo. Al guardar, el panel se cierra y la tarjeta se actualiza.
- **Abrir en pantalla completa** lleva a la página `/asistencia`, más cómoda en la cancha o en una tablet.

---

## 10. Lo que ven las familias (sin cuenta)

Son páginas públicas, pensadas para el celular, sin login y sin el menú del sistema.

### Link del grupo: `/convocatoria/<token>`

- Escudo y color del club, categoría, competencia, rival y día.
- Presentación, hora del partido y camiseta.
- **"¿Vas? Tocá tu nombre":** la lista de convocados con su estado (Va / No puede / Sin responder).
  - Al tocar un nombre aparecen **Voy** y **No puedo**. "No puedo" pide un motivo opcional que ve solo el profe.
  - El celular recuerda quién respondió.
- **Dónde**, con mapa y **Cómo llegar**, y qué llevar.
- **Agendalo:**
  - **Google Calendar** abre el evento armado;
  - **iPhone u Outlook** baja un archivo de calendario (`.ics`): al abrirlo, el teléfono ofrece agregar el partido a la agenda.
- Avisos de **Partido suspendido**, **postergado** o **Actualizado**.
- Al compartir el link, WhatsApp muestra una vista previa con el partido y el escudo.

### Link personal: `/convocatoria/responder/<token>`

El mismo contenido, preguntando directamente por un jugador ("¿Lucía G. va al partido?"). Es el que manda el botón verde de recordatorio.

### Privacidad

De los convocados se muestra solo el nombre y la inicial del apellido. Nunca aparecen el DNI, los teléfonos ni los papeles. Un link inválido muestra "Link no válido o vencido".

---

## 11. Qué todavía es de ejemplo

Estos módulos todavía muestran datos de ejemplo (el banner "Modo Demo"): **Indumentaria**, **Materiales**, **Canchas**, **Análisis** y **Proyecto**, además del inicio y la paleta de Ctrl + K. La API ya tiene inventario y canchas. Falta conectar las pantallas (ver [decisiones-producto.md](decisiones-producto.md#pendiente)).

---

## 12. Para desarrollo

- **Front:** `pnpm dev`. La guía completa está en el [README](../README.md).
- **API:** `docker compose up`. Los links de la convocatoria salen de `FRONTEND_URL` en el `.env` de la API. Si el front corre en otro puerto (por ejemplo `pnpm dev --port 3125`), poné `FRONTEND_URL=http://localhost:3125` y corré `php artisan config:clear`.
- **Zona horaria de los mensajes:** `CLUB_TIMEZONE` en la API (por defecto `America/Argentina/Buenos_Aires`).
- **Contrato de la API:** `lib/api/schema.d.ts`, generado del `openapi.json` de la API.
- **Permisos por rol:** [roles-y-permisos.md](https://github.com/finalproyectogrupo8-max/API_Sportiva/blob/main/docs/roles-y-permisos.md) en el repo de la API.
