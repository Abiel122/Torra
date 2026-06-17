#!/usr/bin/env node
import { execa } from 'execa'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { loadState } from '../state/store.js'

const proxyUrl = `socks5h://127.0.0.1:${loadState().torSocksPort}`

const binPaths = [
  '/usr/local/bin/opencode',
  '/usr/bin/opencode',
  '/home/codespace/.local/bin/opencode',
]

function findBinary(): string | null {
  for (const p of binPaths) {
    if (existsSync(p)) return p
  }
  return null
}

async function findProxychains(): Promise<string | null> {
  try {
    await execa('which', ['proxychains4'], { stdio: 'ignore' })
    return 'proxychains4'
  } catch {
    try {
      await execa('which', ['proxychains'], { stdio: 'ignore' })
      return 'proxychains'
    } catch {
      return null
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const useProxychains = args.includes('--proxychains') || args.includes('--full')
  const cleanArgs = args.filter(a => a !== '--proxychains' && a !== '--full')
  const binPath = findBinary() || 'opencode'

  const baseEnv: Record<string, string> = {
    HTTP_PROXY: proxyUrl,
    HTTPS_PROXY: proxyUrl,
    ALL_PROXY: proxyUrl,
    http_proxy: proxyUrl,
    https_proxy: proxyUrl,
    all_proxy: proxyUrl,
    NODE_NO_WARNINGS: '1',
  }

  // ── MODE: proxychains (catches EVERYTHING: TCP, DNS, WebSocket) ──
  if (useProxychains) {
    const pc = await findProxychains()
    if (!pc) {
      console.error('[torra] proxychains4 not found. Falling back to default mode...')
    } else {
      console.error(`[torra] opencode via ${pc} → Tor :${loadState().torSocksPort} (FULL)`)
      execa(pc, [binPath, ...cleanArgs], { stdio: 'inherit', env: { ...process.env, ...baseEnv }, reject: false })
      return
    }
  }

  // ── MODE: default (env vars + Node.js preload hook) ──
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const preloadPath = resolve(__dirname, '../proxy/preload.js')

  const env: Record<string, string> = {
    ...Object.fromEntries(Object.entries(process.env).map(([k, v]) => [k, v ?? ''])),
    ...baseEnv,
    NODE_OPTIONS: process.env.NODE_OPTIONS
      ? `--require ${preloadPath} ${process.env.NODE_OPTIONS}`
      : `--require ${preloadPath}`,
  }

  console.error(`[torra] opencode via SOCKS5 :${loadState().torSocksPort} + preload (Node.js hooks)`)
  execa(binPath, cleanArgs, { stdio: 'inherit', env, reject: false })
}

main()
