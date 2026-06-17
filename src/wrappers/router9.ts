#!/usr/bin/env node
import { execa, execaSync } from 'execa'
import { existsSync, realpathSync } from 'node:fs'

const args = process.argv.slice(2)

const OUR_PATHS = [
  '/usr/local/bin/9router',
  '/usr/bin/9router',
]

function findRealBinary(): string | null {
  // Skip our own wrapper — find the REAL 9router via which -a
  try {
    const { stdout } = execaSync('which', ['-a', '9router'])
    const paths = stdout.split('\n').filter(Boolean)
    for (const p of paths) {
      try {
        const resolved = realpathSync(p)
        if (resolved !== OUR_PATHS[0] && !resolved.includes('dist/wrappers')) {
          return p
        }
      } catch {
        return p
      }
    }
  } catch { /* not found */ }

  // Fallback: check common paths
  for (const p of ['/bin/9router', '/usr/bin/9router']) {
    if (existsSync(p)) {
      try {
        const resolved = realpathSync(p)
        if (!resolved.includes('dist/wrappers')) return p
      } catch {
        return p
      }
    }
  }

  return null
}

const binPath = findRealBinary()

if (!binPath) {
  console.error('[torra] 9router binary not found. Is it installed?')
  process.exit(1)
}

console.error(`[torra] 9router via NATIVE (no proxy) → ${args.join(' ') || 'interactive'}`)

execa(binPath, args, { stdio: 'inherit', reject: false })
