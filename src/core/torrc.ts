import { writeFileSync, readFileSync, existsSync, unlinkSync, renameSync, copyFileSync } from 'node:fs'
import { execa } from 'execa'
import { loadState } from '../state/store.js'
import { sudo, hasSystemd, startTor, stopTor, waitForTor } from './tor.js'

export interface TorrcConfig {
  socksPort: number
  controlPort: number
  dnsPort: number
  exitCountry: string | null
  excludeCountries: string
}

const TORRC_TEMPLATE = `# TORRA MANAGED CONFIG — DO NOT EDIT MANUALLY
SocksPort {socks_port}
ControlPort {control_port}
CookieAuthentication 1

DNSPort {dns_port}
AutomapHostsOnResolve 1

{exit_nodes}
ExcludeNodes {exclude_nodes}
StrictNodes 1

NumEntryGuards 3
EnforceDistinctSubnets 1

Log notice file /var/log/tor/notices.log
SafeLogging 1
`

const TORRC_PATH = '/etc/tor/torrc'
const BACKUP_PATH = '/etc/tor/torrc.torra.bak'
const TEMP_PATH = '/tmp/torra_torrc'

function fmtCountries(csv: string): string {
  return csv.split(',').map(c => c.trim()).filter(Boolean).map(c => `{${c}}`).join(',')
}

function validateTorrc(path: string): boolean {
  try {
    const content = readFileSync(path, 'utf-8')
    if (!content.includes('SocksPort')) return false
    if (!content.includes('ControlPort')) return false
    return true
  } catch {
    return false
  }
}

export function generateTorrc(config: TorrcConfig): string {
  const exitNodes = config.exitCountry
    ? `ExitNodes {${config.exitCountry}}`
    : '# ExitNodes (not set)'

  const excludeNodes = fmtCountries(config.excludeCountries) || '{cn},{ru},{ir},{kp}'

  return TORRC_TEMPLATE
    .replace('{socks_port}', String(config.socksPort))
    .replace('{control_port}', String(config.controlPort))
    .replace('{dns_port}', String(config.dnsPort))
    .replace('{exit_nodes}', exitNodes)
    .replace('{exclude_nodes}', excludeNodes)
}

export async function applyTorrc(config: TorrcConfig): Promise<boolean> {
  const content = generateTorrc(config)
  const sudoPrefix = sudo()

  try {
    writeFileSync(TEMP_PATH, content, 'utf-8')

    if (!validateTorrc(TEMP_PATH)) {
      throw new Error('Generated torrc validation failed')
    }

    if (existsSync(TORRC_PATH)) {
      await execa('cp', [...sudoPrefix, TORRC_PATH, BACKUP_PATH], { stdio: 'ignore' })
    }

    await execa('cp', [...sudoPrefix, TEMP_PATH, TORRC_PATH], { stdio: 'ignore' })
    unlinkSync(TEMP_PATH)

    return true
  } catch (err) {
    if (existsSync(BACKUP_PATH)) {
      await execa('cp', [...sudoPrefix, BACKUP_PATH, TORRC_PATH]).catch(() => {})
    }
    throw err
  }
}

export async function changeExitCountry(countryCode: string | null): Promise<boolean> {
  const state = loadState()

  const config: TorrcConfig = {
    socksPort: state.torSocksPort,
    controlPort: state.torControlPort,
    dnsPort: 5353,
    exitCountry: countryCode,
    excludeCountries: state.excludeCountries,
  }

  await applyTorrc(config)
  await stopTor()
  await new Promise(r => setTimeout(r, 1500))
  const ok = await startTor()

  if (!ok && countryCode) {
    const backup: TorrcConfig = {
      ...config,
      exitCountry: state.exitCountry,
    }
    await applyTorrc(backup).catch(() => {})
    await stopTor()
    await new Promise(r => setTimeout(r, 1500))
    await startTor()
  }

  return ok
}

export function readCurrentTorrc(): string | null {
  try {
    if (existsSync(TORRC_PATH)) {
      return readFileSync(TORRC_PATH, 'utf-8')
    }
    return null
  } catch {
    return null
  }
}
