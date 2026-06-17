#!/usr/bin/env node
import { execa } from 'execa'
import { loadState } from '../state/store.js'

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: tor-run <command> [args...]')
  console.error()
  console.error('Runs any command through Tor using socks5h:// proxy env vars.')
  console.error()
  console.error('Examples:')
  console.error('  tor-run npx opencode')
  console.error('  tor-run npm install some-package')
  console.error('  tor-run pip install requests')
  process.exit(1)
}

const state = loadState()
const proxyUrl = `socks5h://127.0.0.1:${state.torSocksPort}`

const env = {
  ...process.env,
  HTTP_PROXY: proxyUrl,
  HTTPS_PROXY: proxyUrl,
  ALL_PROXY: proxyUrl,
  http_proxy: proxyUrl,
  https_proxy: proxyUrl,
  all_proxy: proxyUrl,
}

const cmd = args[0]
const cmdArgs = args.slice(1)

console.error(`[torra] tor-run via SOCKS5 → Tor :${state.torSocksPort}`)
console.error(`[torra] ${cmd} ${cmdArgs.join(' ')}`)

execa(cmd, cmdArgs, { stdio: 'inherit', env, reject: false })
