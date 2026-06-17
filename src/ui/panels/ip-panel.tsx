import React, { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import Spinner from '../spinner.js'
import { getRealIp, getIpInfo } from '../../core/ip.js'
import { torStatus } from '../../core/tor.js'
import { COLORS } from '../theme.js'

export default function IpPanel({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [realIp, setRealIp] = useState<string | null>(null)
  const [torInfo, setTorInfo] = useState<Record<string, string> | null>(null)
  const [torOn, setTorOn] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [real, info, tor] = await Promise.all([
        getRealIp(),
        getIpInfo(true),
        torStatus(),
      ])
      if (cancelled) return
      setRealIp(real)
      setTorInfo(info ? { ip: info.ip || 'N/A', country: info.country || 'N/A', city: info.city || 'N/A', region: info.region || 'N/A', org: info.org || 'N/A', timezone: info.timezone || 'N/A' } : null)
      setTorOn(tor)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(onBack, 5000)
      return () => clearTimeout(timer)
    }
  }, [loading, onBack])

  if (loading) {
    return <Spinner label="Fetching IP information..." />
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={COLORS.error}>⚠ REAL IP (without Tor)</Text>
      </Box>
      <Text color={COLORS.textPrimary}>  IP: {realIp || 'Failed to get'}</Text>

      <Box marginTop={1} marginBottom={1}>
        <Text bold color={COLORS.success}>🛡 IP via Tor</Text>
      </Box>

      {torInfo ? (
        <Box flexDirection="column">
          <Text color={COLORS.textPrimary}>  IP:       {torInfo.ip}</Text>
          <Text color={COLORS.textPrimary}>  Country:  {torInfo.country}</Text>
          <Text color={COLORS.textPrimary}>  City:     {torInfo.city}</Text>
          <Text color={COLORS.textPrimary}>  Region:   {torInfo.region}</Text>
          <Text color={COLORS.textPrimary}>  ISP/Org:  {torInfo.org}</Text>
          <Text color={COLORS.textPrimary}>  Timezone: {torInfo.timezone}</Text>
        </Box>
      ) : (
        <Text color={torOn ? COLORS.error : COLORS.textDim}>
          {torOn ? 'Failed to connect (timeout)' : 'Tor is not active'}
        </Text>
      )}

      <Box marginTop={1}>
        <Text color={COLORS.textDim}>Auto-return in 5s... (Enter to continue)</Text>
      </Box>
    </Box>
  )
}
