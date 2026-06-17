#!/usr/bin/env node
import { getTorIp } from '../core/ip.js'
import { torStatus } from '../core/tor.js'

async function main() {
  const active = await torStatus()
  if (!active) {
    console.error('[tor] Tor is not active.')
    process.exit(1)
  }

  const ip = await getTorIp()
  if (ip) {
    console.log(`[tor] IP via Tor: ${ip}`)
  } else {
    console.error('[tor] Failed to get IP. Circuit may not be ready.')
    process.exit(1)
  }
}

main()
