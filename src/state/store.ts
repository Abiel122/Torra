import Conf from 'conf'

export interface TorraState {
  circuitLocked: boolean
  exitCountry: string | null
  proxyBridgePort: number
  proxyBridgeActive: boolean
  autoRotateInterval: number
  torSocksPort: number
  torControlPort: number
  excludeCountries: string
}

const DEFAULTS: TorraState = {
  circuitLocked: false,
  exitCountry: null,
  proxyBridgePort: 8080,
  proxyBridgeActive: false,
  autoRotateInterval: 30,
  torSocksPort: 9050,
  torControlPort: 9051,
  excludeCountries: 'cn,ru,ir,kp',
}

let _store: Conf<TorraState> | null = null

function getStore(): Conf<TorraState> {
  if (!_store) {
    _store = new Conf<TorraState>({
      projectName: 'torra',
      defaults: DEFAULTS,
    })
  }
  return _store
}

export function loadState(): TorraState {
  const store = getStore()
  return { ...DEFAULTS, ...store.store }
}

export function saveState(partial: Partial<TorraState>): TorraState {
  const store = getStore()
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) {
      store.set(key as keyof TorraState, value as never)
    }
  }
  return loadState()
}

export function resetState(): void {
  const store = getStore()
  store.clear()
}
