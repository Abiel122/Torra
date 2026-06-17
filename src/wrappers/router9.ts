#!/usr/bin/env node
import { execa } from 'execa'
import { existsSync } from 'node:fs'

const args = process.argv.slice(2)
const binPaths = ['/usr/local/bin/9router', '/usr/bin/9router']

function findBinary(): string | null {
  for (const p of binPaths) {
    if (existsSync(p)) return p
  }
  return null
}

const binPath = findBinary() || '9router'

console.error(`[torra] 9router via NATIVE (no proxy) → ${args.join(' ') || 'interactive'}`)

// JALAN POLOS — no proxy env vars at all
execa(binPath, args, { stdio: 'inherit', reject: false })
