import https from 'node:https'
import http from 'node:http'
import { loadState } from '../state/store.js'
import { SocksProxyAgent } from 'socks-proxy-agent'

const IP_ENDPOINTS = [
  'https://api.ipify.org?format=json',
  'https://ifconfig.me/all.json',
  'https://icanhazip.com',
]

interface IpInfo {
  ip?: string
  country?: string
  city?: string
  region?: string
  org?: string
  timezone?: string
}

function extractIp(text: string, isJson: boolean): string | null {
  if (isJson) {
    try {
      const data = JSON.parse(text)
      return data.ip || data.ip_addr || null
    } catch {
      return null
    }
  }
  return text.trim() || null
}

function httpsGet(url: string, agent?: SocksProxyAgent, timeout = 8000): Promise<string | null> {
  return new Promise((resolve) => {
    const opts: https.RequestOptions = {
      method: 'GET',
      timeout,
      headers: { 'User-Agent': 'curl/8.0' },
      rejectUnauthorized: true,
    }

    if (agent) {
      opts.agent = agent
    }

    const req = https.request(url, opts, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => { resolve(data) })
    })

    req.on('error', () => { resolve(null) })
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.end()
  })
}

export async function getRealIp(timeout = 8000): Promise<string | null> {
  for (const url of IP_ENDPOINTS) {
    const text = await httpsGet(url, undefined, timeout)
    if (!text) continue
    const isJson = url.includes('json')
    const ip = extractIp(text, isJson)
    if (ip) return ip
  }
  return null
}

export async function getTorIp(timeout = 15000): Promise<string | null> {
  const state = loadState()
  const proxyUrl = `socks5h://127.0.0.1:${state.torSocksPort}`
  const agent = new SocksProxyAgent(proxyUrl)

  for (const url of IP_ENDPOINTS) {
    const text = await httpsGet(url, agent, timeout)
    if (!text) continue
    const isJson = url.includes('json')
    const ip = extractIp(text, isJson)
    if (ip) return ip
  }
  return null
}

export async function getIpInfo(useTor = false, timeout = 15000): Promise<IpInfo | null> {
  const state = loadState()
  const agent = useTor
    ? new SocksProxyAgent(`socks5h://127.0.0.1:${state.torSocksPort}`)
    : undefined

  const text = await httpsGet('https://ipinfo.io/json', agent, timeout)
  if (!text) return null

  try {
    return JSON.parse(text) as IpInfo
  } catch {
    return null
  }
}
