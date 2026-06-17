import React from 'react'
import { Text, Box } from 'ink'
import { ConfirmInput } from '@inkjs/ui'
import { COLORS } from '../theme.js'
import { getRouteTable } from '../../proxy/router.js'

const MODE_COLORS: Record<string, string> = {
  socks5: COLORS.success,
  proxychains: COLORS.warning,
  native: COLORS.accentCyan,
  bridge: COLORS.orange,
}

export default function RoutePanel({ onBack }: { onBack: () => void }): React.JSX.Element {
  const table = getRouteTable()

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={COLORS.accentCyan}>⛓ Route Table</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text bold color={COLORS.textSecondary}>Binary          Mode</Text>
        {Object.entries(table).map(([bin, entry]) => (
          <Text key={bin}>
            <Text bold color={COLORS.textPrimary}>{bin.padEnd(16)}</Text>
            <Text color={MODE_COLORS[entry.mode] || COLORS.textDim}>
              {entry.mode.toUpperCase()}
              {entry.mode === 'socks5' ? ' → Tor :9050' : ''}
              {entry.mode === 'proxychains' ? ' → proxychains4' : ''}
              {entry.mode === 'native' ? ' (no proxy)' : ''}
            </Text>
          </Text>
        ))}
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text bold color={COLORS.textSecondary}>How routing works:</Text>
        <Text color={COLORS.textDim}>  • opencode → SOCKS5 env vars → Tor (fully anonymous)</Text>
        <Text color={COLORS.textDim}>  • 9router  → Native (no proxy, original routing)</Text>
        <Text color={COLORS.textDim}>  • pcpip/pcpython → proxychains4 → Tor</Text>
        <Text color={COLORS.textDim}>{'  • tor-run <cmd> → auto-detect best route'}</Text>
      </Box>

      <Box marginTop={1}>
        <ConfirmInput onConfirm={() => onBack()} onCancel={() => {}} />
      </Box>
    </Box>
  )
}
