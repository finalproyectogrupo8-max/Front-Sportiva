import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Datos de la versión para el pie del sistema. Se fijan al compilar.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

function commit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    APP_VERSION: version,
    APP_COMMIT: commit(),
    APP_BUILT_AT: new Date().toISOString(),
    // production, preview o development (Vercel); fuera de Vercel, el modo de Node.
    APP_ENV: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
  },
}

export default nextConfig
