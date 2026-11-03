#!/usr/bin/env bash
# Setup del front de Sportiva para desarrollo local. Es idempotente: se puede correr las veces que haga falta.
#
#   bash scripts/setup.sh
#
# Hace, en orden: instala Node 24 con nvm si falta (sin sudo), activa pnpm con corepack, crea
# .env.local si no existe, instala dependencias, arranca "pnpm dev" en segundo plano y espera a que
# responda en http://127.0.0.1:3000.
#
# NO corta la ejecución por un error recuperable: cada paso reintenta y, si algo quedó pendiente, lo
# dice al final con el comando para reintentarlo. Nunca sobrescribe un .env.local existente.
#
# Requisitos: la API corriendo (scripts/setup.sh de api-sportiva). Sin la API el front arranca igual,
# pero las pantallas muestran error de conexión.

# Sin -e a propósito: un paso que falla no debe matar al resto.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 0

NODE_MAJOR=24
PORT=3000
LOG_FILE=".dev.log"
PID_FILE=".dev.pid"
PENDING=()

info() { printf '\n==> %s\n' "$*"; }
ok() { printf '    OK: %s\n' "$*"; }
warn() { printf '    AVISO: %s\n' "$*" >&2; }

retry() {
    local attempts=$1; shift
    local i
    for ((i = 1; i <= attempts; i++)); do
        if "$@"; then return 0; fi
        if ((i < attempts)); then
            warn "intento $i de $attempts falló; reintento en $((i * 5)) s"
            sleep $((i * 5))
        fi
    done
    return 1
}

# Node 20.9 o superior (requisito de Next.js 16). Se instala con nvm en el home del usuario.
node_ok() {
    command -v node > /dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ]
}

ensure_node() {
    node_ok && return 0

    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
        retry 3 bash -c 'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash' || return 1
    fi
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    retry 3 nvm install "$NODE_MAJOR" > /dev/null || return 1
    nvm alias default "$NODE_MAJOR" > /dev/null
    node_ok
}

ensure_pnpm() {
    # La versión sale de "packageManager" en package.json: corepack la descarga sola.
    if command -v pnpm > /dev/null 2>&1; then return 0; fi
    corepack enable 2> /dev/null || true
    command -v pnpm > /dev/null 2>&1 || retry 2 npm install -g pnpm@12 > /dev/null 2>&1
    command -v pnpm > /dev/null 2>&1
}

install_deps() { pnpm install --frozen-lockfile; }

server_answers() {
    curl -fsS -o /dev/null --max-time 5 "http://127.0.0.1:${PORT}/login"
}

start_dev() {
    if server_answers; then
        ok "ya hay un servidor en http://127.0.0.1:${PORT}: no se arranca otro"
        return 0
    fi
    nohup setsid pnpm dev --port "$PORT" > "$LOG_FILE" 2>&1 < /dev/null &
    echo $! > "$PID_FILE"

    local i
    for ((i = 0; i < 90; i++)); do
        if server_answers; then return 0; fi
        sleep 2
    done
    return 1
}

summary() {
    printf '\n============================================================\n'
    if ((${#PENDING[@]} == 0)); then
        printf 'Front listo.\n'
    else
        printf 'Front: quedó pendiente lo siguiente (el resto sí se completó):\n'
        local p
        for p in "${PENDING[@]}"; do printf '  - %s\n' "$p"; done
    fi
    printf '\nApp:       http://127.0.0.1:%s\n' "$PORT"
    printf 'Log:       %s (si el servidor no responde, mirá ahí)\n' "$LOG_FILE"
    printf '============================================================\n'
}

info "Node.js ${NODE_MAJOR}"
if ensure_node; then ok "node $(node -v)"; else warn "no se pudo instalar Node ${NODE_MAJOR}"; PENDING+=("Instalar Node ${NODE_MAJOR} (nvm install ${NODE_MAJOR}) y volver a correr: bash scripts/setup.sh"); fi

info "pnpm"
if command -v node > /dev/null 2>&1 && ensure_pnpm; then ok "pnpm $(pnpm -v)"; else warn "pnpm no disponible"; PENDING+=("Instalar pnpm (corepack enable) y volver a correr: bash scripts/setup.sh"); fi

if [ ! -f .env.local ]; then
    info "Creando .env.local a partir de .env.example"
    cp .env.example .env.local
else
    info ".env.local ya existe: se deja como está"
fi

# Los puertos locales hablan HTTP. Un API_URL con https:// (o sin esquema) rompe el cliente con
# "EPROTO: The TLS handshake failed". Se corrige solo cuando apunta a loopback o le falta el esquema.
normalize_api_url() {
    local value fixed
    value="$(grep -E '^API_URL=' .env.local | cut -d= -f2- || true)"
    [ -n "$value" ] || return 0
    case "$value" in
        https://127.0.0.1* | https://localhost*) fixed="${value/https:\/\//http:\/\/}" ;;
        http://* | https://*) return 0 ;;
        *) fixed="http://$value" ;;
    esac
    awk -v v="$fixed" 'BEGIN{FS=OFS="="} $1=="API_URL"{print "API_URL=" v; next} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
    warn "API_URL no servía para desarrollo local: se cambió a $fixed (antes: $value)"
}
normalize_api_url

if command -v pnpm > /dev/null 2>&1; then
    info "Instalando dependencias (pnpm install)"
    if retry 3 install_deps; then ok "dependencias instaladas"; else warn "pnpm install falló"; PENDING+=("Instalar dependencias: pnpm install --frozen-lockfile"); fi

    info "Levantando el servidor de desarrollo"
    if retry 2 start_dev; then ok "app respondiendo"; else warn "el servidor no respondió a tiempo"; PENDING+=("Revisar ${LOG_FILE} y arrancar a mano: pnpm dev"); fi
fi

summary
exit 0
