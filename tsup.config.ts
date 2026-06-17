import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    cli: 'src/index.tsx',
    'wrappers/pcurl': 'src/wrappers/pcurl.ts',
    'wrappers/pcpip': 'src/wrappers/pcpip.ts',
    'wrappers/pcpython': 'src/wrappers/pcpython.ts',
    'wrappers/pcnpm': 'src/wrappers/pcnpm.ts',
    'wrappers/pcwget': 'src/wrappers/pcwget.ts',
    'wrappers/opencode': 'src/wrappers/opencode.ts',
    'wrappers/router9': 'src/wrappers/router9.ts',
    'wrappers/tor-run': 'src/wrappers/tor-run.ts',
    'wrappers/torip': 'src/wrappers/torip.ts',
    'wrappers/realip': 'src/wrappers/realip.ts',
    'wrappers/leakcheck': 'src/wrappers/leakcheck.ts',
  },
  format: ['esm'],
  target: 'node18',
  clean: true,
  bundle: true,
  external: ['react', 'ink', 'ink-gradient', 'ink-big-text', '@inkjs/ui'],
})
