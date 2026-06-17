#!/usr/bin/env node
import { execa } from 'execa'
import { existsSync } from 'node:fs'
import { loadState } from '../state/store.js'

const args = process.argv.slice(2)
const state = loadState()
const proxyUrl = `socks5h://127.0.0.1:${state.torSocksPort}`

const binPaths = ['/usr/local/bin/opencode', '/usr/bin/opencode', '/home/codespace/.local/bin/opencode']

function findBinary(): string | null {
  for (const p of binPaths) {
    if (existsSync(p)) return p
  }
  return null
}

const binPath = findBinary() || 'opencode'

const env = {
  ...process.env,
  HTTP_PROXY: proxyUrl,
  HTTPS_PROXY: proxyUrl,
  ALL_PROXY: proxyUrl,
  http_proxy: proxyUrl,
  https_proxy: proxyUrl,
  all_proxy: proxyUrl,
  NODE_NO_WARNINGS: '1',
}

console.error(`[torra] opencode via SOCKS5 → Tor :${state.torSocksPort} (${args.join(' ') || 'interactive'})`)

execa(binPath, args, { stdio: 'inherit', env, reject: false })
