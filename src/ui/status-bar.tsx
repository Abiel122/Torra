import React from 'react'
import { Text, Box } from 'ink'
import { COLORS } from './theme.js'

export interface StatusBarProps {
  torActive: boolean
  proxyBridgeActive: boolean
  circuitLocked: boolean
  exitCountry: string | null
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <Box marginRight={1}>
      <Text bold color={color}>
        ● {label}
      </Text>
    </Box>
  )
}

export default function StatusBar({
  torActive,
  proxyBridgeActive,
  circuitLocked,
  exitCountry,
}: StatusBarProps): React.JSX.Element {
  return (
    <Box marginBottom={1}>
      <Badge label={torActive ? 'TOR ACTIVE' : 'TOR OFF'} color={torActive ? COLORS.success : COLORS.error} />
      <Badge label={proxyBridgeActive ? 'PROXY BRIDGE ON' : 'PROXY BRIDGE OFF'} color={proxyBridgeActive ? COLORS.success : COLORS.textDim} />
      <Badge label={circuitLocked ? 'CIRCUIT LOCKED' : 'CIRCUIT UNLOCKED'} color={circuitLocked ? COLORS.warning : COLORS.textDim} />
      {exitCountry && (
        <Badge label={`EXIT: ${exitCountry.toUpperCase()}`} color={COLORS.accentCyan} />
      )}
    </Box>
  )
}
