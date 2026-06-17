import { execa, execaSync } from 'execa'
import { createConnection, type Socket } from 'node:net'
import { existsSync, readFileSync } from 'node:fs'
import { loadState } from '../state/store.js'

const SUDO_CMD = 'sudo'

function isRoot(): boolean {
  try {
    return process.geteuid?.() === 0
  } catch {
    return false
  }
}

function sudo(): string[] {
  return isRoot() ? [] : [SUDO_CMD]
}

function hasSystemd(): boolean {
  try {
    execaSync('which', ['systemctl'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function isTermux(): boolean {
  return !!process.env.PREFIX?.includes('com.termux')
}

export async function torStatus(): Promise<boolean> {
  const state = loadState()
  try {
    const sock = createConnection({ host: '127.0.0.1', port: state.torSocksPort, timeout: 1500 })
    await new Promise<void>((resolve, reject) => {
      sock.on('connect', () => { sock.destroy(); resolve() })
      sock.on('error', reject)
    })
    return true
  } catch {
    if (hasSystemd()) {
      try {
        await execa('systemctl', ['is-active', '--quiet', 'tor'])
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

export async function startTor(): Promise<boolean> {
  const state = loadState()
  if (await torStatus()) return true

  if (isTermux()) {
    execa('tor', { stdio: 'ignore', stderr: 'ignore' })
  } else if (hasSystemd()) {
    try {
      await execa('systemctl', [...sudo(), 'enable', 'tor'], { stdio: 'ignore' })
      await execa('systemctl', [...sudo(), 'restart', 'tor'], { stdio: 'ignore' })
    } catch {
      await execa('service', [...sudo(), 'tor', 'restart'], { stdio: 'ignore' })
    }
  } else {
    execa('tor', { stdio: 'ignore', stderr: 'ignore' })
  }

  return waitForTor(state.torSocksPort, 120_000)
}

export async function stopTor(): Promise<void> {
  if (hasSystemd()) {
    try {
      await execa('systemctl', [...sudo(), 'stop', 'tor'], { stdio: 'ignore' })
    } catch { /* ok */ }
  }
  try {
    await execa('pkill', ['-x', 'tor'], { stdio: 'ignore' })
  } catch { /* ok */ }
}

export async function waitForTor(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const sock = createConnection({ host: '127.0.0.1', port, timeout: 800 })
      await new Promise<void>((resolve, reject) => {
        sock.on('connect', () => { sock.destroy(); resolve() })
        sock.on('error', reject)
      })
      return true
    } catch {
      await sleep(500)
    }
  }
  return false
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

export async function checkSystemDeps(): Promise<{ tor: boolean; proxychains: boolean }> {
  const results = { tor: false, proxychains: false }

  try {
    await execa('which', ['tor'], { stdio: 'ignore' })
    results.tor = true
  } catch { /* not found */ }

  try {
    await execa('which', ['proxychains4'], { stdio: 'ignore' })
    results.proxychains = true
  } catch {
    try {
      await execa('which', ['proxychains'], { stdio: 'ignore' })
      results.proxychains = true
    } catch { /* not found */ }
  }

  return results
}

export async function installTor(): Promise<boolean> {
  if (isTermux()) {
    try {
      await execa('pkg', ['update', '-y'], { stdio: 'inherit' })
      await execa('pkg', ['install', '-y', 'tor'], { stdio: 'inherit' })
      return true
    } catch { return false }
  }

  try {
    await execa('apt', [...sudo(), 'update', '-y'], { stdio: 'inherit' })
    await execa('apt', [...sudo(), 'install', '-y', 'tor'], { stdio: 'inherit' })
    return true
  } catch { return false }
}

export async function installProxychains(): Promise<boolean> {
  if (isTermux()) {
    try {
      await execa('pkg', ['install', '-y', 'proxychains-ng'], { stdio: 'inherit' })
      return true
    } catch { return false }
  }

  try {
    await execa('apt', [...sudo(), 'install', '-y', 'proxychains4'], { stdio: 'inherit' })
    return true
  } catch {
    try {
      await execa('apt', [...sudo(), 'install', '-y', 'proxychains'], { stdio: 'inherit' })
      return true
    } catch { return false }
  }
}

export { hasSystemd, sudo }
