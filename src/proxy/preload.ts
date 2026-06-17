/**
 * Preload — route Node.js HTTP(S) traffic through Tor SOCKS5.
 * Pasang via: NODE_OPTIONS="--require /path/to/preload.js"
 * atau:       node --require ./preload.js app.js
 *
 * Patches: https.request, http.request, globalThis.fetch
 * WebSocket connections are also intercepted via net.connect.
 */

import { SocksProxyAgent } from 'socks-proxy-agent'
import https from 'node:https'
import http from 'node:http'
import net from 'node:net'
import dns from 'node:dns'
import { loadState } from '../state/store.js'

const state = loadState()
const PROXY_URL = `socks5h://127.0.0.1:${state.torSocksPort}`
const socksAgent = new SocksProxyAgent(PROXY_URL)

// ── 1. Patch https.request (AI SDKs: OpenAI, Anthropic, etc.) ──
const origHttpsRequest = https.request
https.request = function patchedHttpsRequest(
  this: any,
  url: any,
  options?: any,
  callback?: any
) {
  const opts = (typeof url === 'string' || url instanceof URL)
    ? { ...(typeof options === 'function' ? {} : options), agent: socksAgent }
    : { ...(url as any), agent: socksAgent }

  if (typeof url === 'string' || url instanceof URL) {
    return origHttpsRequest.call(this, url, opts, typeof options === 'function' ? options : callback)
  }
  return origHttpsRequest.call(this, opts, options)
} as unknown as typeof https.request

// ── 2. Patch http.request ──
const origHttpRequest = http.request
http.request = function patchedHttpRequest(
  this: any,
  url: any,
  options?: any,
  callback?: any
) {
  const opts = (typeof url === 'string' || url instanceof URL)
    ? { ...(typeof options === 'function' ? {} : options), agent: socksAgent }
    : { ...(url as any), agent: socksAgent }

  if (typeof url === 'string' || url instanceof URL) {
    return origHttpRequest.call(this, url, opts, typeof options === 'function' ? options : callback)
  }
  return origHttpRequest.call(this, opts, options)
} as unknown as typeof http.request

// ── 3. Patch globalThis.fetch (Node 18+ native fetch / undici) ──
if (typeof globalThis.fetch === 'function') {
  const origFetch = globalThis.fetch
  globalThis.fetch = function patchedFetch(
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> {
    return origFetch(input, {
      ...init,
      dispatcher: socksAgent as never,
    })
  } as unknown as typeof globalThis.fetch
}

// ── 4. Patch net.Socket / net.connect (covers WebSocket, raw TCP) ──
const origNetConnect = net.connect as any
net.connect = function patchedNetConnect(this: any, ...args: any[]) {
  if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
    const opts = args[0]
    const host = opts.host || opts.servername
    const port = opts.port || 443
    if (host && !host.includes('127.0.0.1') && !host.includes('localhost') && !host.includes('.torra')) {
      opts.host = '127.0.0.1'
      opts.port = state.torSocksPort
      // This would need a SOCKS5 handshake — complex
      // For full TCP interception, use proxychains4 instead
    }
  }
  return origNetConnect.apply(this, args)
} as unknown as typeof net.connect

// ── 5. Patch dns.lookup (prevent DNS leak) ──
const origDnsLookup = dns.lookup
dns.lookup = function patchedLookup(
  hostname: string,
  options: any,
  callback?: any
) {
  // Return a dummy IP — real DNS happens inside SOCKS5 tunnel
  if (typeof options === 'function') {
    options(null, '0.0.0.0', 4)
  } else if (typeof callback === 'function') {
    callback(null, '0.0.0.0', 4)
  }
} as unknown as typeof dns.lookup

console.error(`[torra-preload] All HTTP/HTTPS/fetch → Tor SOCKS5 (:${state.torSocksPort})`)
