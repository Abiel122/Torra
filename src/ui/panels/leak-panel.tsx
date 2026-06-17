import React, { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import Spinner from '../spinner.js'
import { getRealIp, getTorIp } from '../../core/ip.js'
import { torStatus } from '../../core/tor.js'
import { COLORS } from '../theme.js'

export default function LeakPanel({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [realIp, setRealIp] = useState<string | null>(null)
  const [torIp, setTorIp] = useState<string | null>(null)
  const [torOn, setTorOn] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [real, tor, torStatusResult] = await Promise.all([
        getRealIp(),
        getTorIp(),
        torStatus(),
      ])
      if (cancelled) return
      setRealIp(real)
      setTorIp(tor)
      setTorOn(torStatusResult)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(onBack, 6000)
      return () => clearTimeout(timer)
    }
  }, [loading, onBack])

  if (loading) {
    return <Spinner label="Running IP leak test..." />
  }

  const leaked = Boolean(realIp && torIp && realIp === torIp)

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={COLORS.accentCyan}>🔬 IP Leak Test</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text>Real IP:  <Text color={leaked ? COLORS.error : COLORS.textPrimary}>{realIp || 'Failed'}</Text></Text>
        <Text>Tor IP:   <Text color={leaked ? COLORS.error : torIp ? COLORS.success : COLORS.error}>{torIp || 'Failed / Tor off'}</Text></Text>
      </Box>

      <Box>
        {!torOn ? (
          <Text bold color={COLORS.error}>✗ Tor is not active! Start Tor from Service Control.</Text>
        ) : leaked ? (
          <Text bold color={COLORS.error}>
            🚨 LEAK DETECTED! IP is NOT hidden.
          </Text>
        ) : torIp ? (
          <Text bold color={COLORS.success}>
            ✅ SECURE — IP is hidden. Real IP ({realIp}) ≠ Tor IP ({torIp})
          </Text>
        ) : (
          <Text bold color={COLORS.warning}>⚠ Tor is active but could not get IP (circuit not ready)</Text>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color={COLORS.textDim}>Auto-return in 6s... (Enter to continue)</Text>
      </Box>
    </Box>
  )
}
