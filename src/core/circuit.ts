import { createConnection } from 'node:net'
import { readFileSync, existsSync } from 'node:fs'
import { loadState, saveState } from '../state/store.js'

const COOKIE_PATHS = [
  '/var/lib/tor/control_auth_cookie',
  '/run/tor/control.authcookie',
  '/tmp/tor/control.authcookie',
]

function findCookieHex(): string | null {
  for (const p of COOKIE_PATHS) {
    if (existsSync(p)) {
      try {
        return readFileSync(p).toString('hex')
      } catch { /* permission */ }
    }
  }
  return null
}

async function torSendSignal(signal: string): Promise<void> {
  const state = loadState()
  const host = '127.0.0.1'
  const port = state.torControlPort
  const cookieHex = findCookieHex()

  const sock = createConnection({ host, port, timeout: 5000 })

  await new Promise<void>((resolve, reject) => {
    sock.on('connect', resolve)
    sock.on('error', reject)
  })

  function send(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      sock.write(cmd + '\r\n')
      sock.once('data', (data) => resolve(data.toString()))
      setTimeout(() => reject(new Error('Timeout')), 3000)
    })
  }

  try {
    let resp: string

    if (cookieHex) {
      resp = await send(`AUTHENTICATE ${cookieHex}`)
    } else {
      resp = await send('AUTHENTICATE ""')
    }

    if (!resp.startsWith('250')) {
      throw new Error(`Auth failed: ${resp.trim()}`)
    }

    resp = await send(`SIGNAL ${signal}`)
    if (!resp.startsWith('250')) {
      throw new Error(`Signal failed: ${resp.trim()}`)
    }

    await send('QUIT')
  } finally {
    sock.destroy()
  }
}

export async function rotateIp(force = false): Promise<boolean> {
  const state = loadState()

  if (state.circuitLocked && !force) {
    return false
  }

  try {
    await torSendSignal('NEWNYM')
    return true
  } catch (err) {
    throw err
  }
}

export function toggleCircuitLock(): boolean {
  const state = loadState()
  const newVal = !state.circuitLocked
  saveState({ circuitLocked: newVal })
  return newVal
}

export function isCircuitLocked(): boolean {
  return loadState().circuitLocked
}
