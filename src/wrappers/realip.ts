#!/usr/bin/env node
import { getRealIp } from '../core/ip.js'

async function main() {
  const ip = await getRealIp()
  if (ip) {
    console.log(`[real] Real IP: ${ip}`)
  } else {
    console.error('[real] Failed to get IP.')
    process.exit(1)
  }
}

main()
