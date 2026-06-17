#!/usr/bin/env node
import { getRealIp, getTorIp } from '../core/ip.js'
import { torStatus } from '../core/tor.js'

async function main() {
  console.log('──────────────────────────')
  const [real, tor, torOn] = await Promise.all([getRealIp(), getTorIp(), torStatus()])

  console.log(`  IP Asli  : ${real || 'gagal'}`)
  console.log(`  IP Tor   : ${tor || (torOn ? 'gagal' : 'tor mati')}`)
  console.log('──────────────────────────')

  if (tor && real && real !== tor) {
    console.log('  ✅ AMAN — IP tersembunyi')
  } else if (tor && real && real === tor) {
    console.log('  🚨 LEAK! IP bocor')
  } else {
    console.log('  ⚠ Tor tidak aktif / gagal konek')
  }
  console.log('──────────────────────────')
}

main()
