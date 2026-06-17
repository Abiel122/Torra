import { SocksProxyAgent } from 'socks-proxy-agent'
import { loadState } from '../state/store.js'

let _globalAgent: SocksProxyAgent | null = null

export function getTorAgent(): SocksProxyAgent {
  if (!_globalAgent) {
    const state = loadState()
    _globalAgent = new SocksProxyAgent(`socks5h://127.0.0.1:${state.torSocksPort}`)
  }
  return _globalAgent
}

export function patchGlobalFetch(): () => void {
  const originalFetch = globalThis.fetch

  globalThis.fetch = function patchedFetch(input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response> {
    const agent = getTorAgent()
    const opts: RequestInit & { agent?: SocksProxyAgent } = {
      ...init,
      agent: agent as never,
    }

    const inputStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url || input.toString()
    return originalFetch(inputStr, opts as RequestInit)
  } as typeof globalThis.fetch

  return () => {
    globalThis.fetch = originalFetch
  }
}
