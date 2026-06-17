import { execa, type Options } from 'execa'
import { loadState } from '../state/store.js'

export type RouteMode = 'socks5' | 'proxychains' | 'native' | 'bridge'

export interface RouteEntry {
  mode: RouteMode
  socksPort?: number
  envVars?: string[]
  useProxychains?: boolean
}

const ROUTE_TABLE: Record<string, RouteEntry> = {
  opencode: { mode: 'socks5', envVars: ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY'] },
  '9router': { mode: 'native' },
  pcurl: { mode: 'socks5' },
  pcpip: { mode: 'proxychains' },
  pcpython: { mode: 'proxychains' },
  pcnpm: { mode: 'proxychains' },
  pcwget: { mode: 'proxychains' },
}

function createSocks5Env(binName: string): Record<string, string> {
  const state = loadState()
  const proxyUrl = `socks5h://127.0.0.1:${state.torSocksPort}`
  return {
    HTTP_PROXY: proxyUrl,
    HTTPS_PROXY: proxyUrl,
    ALL_PROXY: proxyUrl,
    http_proxy: proxyUrl,
    https_proxy: proxyUrl,
    all_proxy: proxyUrl,
  }
}

export async function execWithRoute(
  binName: string,
  binPath: string,
  args: string[],
  extraEnv: Record<string, string> = {}
): Promise<void> {
  const entry = ROUTE_TABLE[binName] || { mode: 'native' }

  const env: Record<string, string> = { ...extraEnv }

  if (entry.mode === 'socks5') {
    const proxyEnv = createSocks5Env(binName)
    Object.assign(env, proxyEnv)
  }

  const options: Options = {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    reject: false,
  }

  if (entry.mode === 'proxychains' || entry.useProxychains) {
    const pc = findProxychains()
    if (pc) {
      await execa(pc, [binPath, ...args], options)
      return
    }
  }

  await execa(binPath, args, options)
}

function findProxychains(): string | null {
  try {
    execa('which', ['proxychains4'], { stdio: 'ignore' })
    return 'proxychains4'
  } catch {
    try {
      execa('which', ['proxychains'], { stdio: 'ignore' })
      return 'proxychains'
    } catch {
      return null
    }
  }
}

export function getRouteTable(): Record<string, RouteEntry> {
  return { ...ROUTE_TABLE }
}
