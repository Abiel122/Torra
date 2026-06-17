import React, { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import { Select, ConfirmInput } from '@inkjs/ui'
import { COLORS } from '../theme.js'
import { startBridge, stopBridge, isBridgeRunning } from '../../proxy/bridge.js'
import { loadState } from '../../state/store.js'
import { torStatus } from '../../core/tor.js'

export default function ProxyBridgePanel({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [bridgeActive, setBridgeActive] = useState(isBridgeRunning)
  const [torOn, setTorOn] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const port = loadState().proxyBridgePort

  useEffect(() => {
    torStatus().then(setTorOn)
  }, [])

  async function toggleBridge() {
    if (bridgeActive) {
      stopBridge()
      setBridgeActive(false)
      setStatus('Proxy bridge stopped')
    } else {
      if (!torOn) {
        setStatus('Tor is not active. Start Tor first.')
        return
      }
      try {
        await startBridge(port)
        setBridgeActive(true)
        setStatus(`Proxy bridge running on 127.0.0.1:${port} → Tor :9050`)
      } catch (err) {
        setStatus(`Failed: ${err}`)
      }
    }
  }

  if (status) {
    return (
      <Box flexDirection="column">
        <Text color={status.includes('Error') || status.includes('not') ? COLORS.warning : COLORS.textPrimary}>{status}</Text>
        <Box marginTop={1}>
          <ConfirmInput onConfirm={() => { setStatus(null); onBack() }} onCancel={() => {}} />
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={COLORS.accentCyan}>🧅 AI Proxy Bridge</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Status: <Text color={bridgeActive ? COLORS.success : COLORS.textDim}>{bridgeActive ? '● Active' : '● Inactive'}</Text></Text>
        <Text>Tor:    <Text color={torOn ? COLORS.success : COLORS.error}>{torOn ? '● Ready' : '● Off'}</Text></Text>
        <Text>Port:   <Text bold>{port}</Text></Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text bold color={COLORS.textSecondary}>What this does:</Text>
        <Text color={COLORS.textDim}>Creates an HTTP CONNECT proxy on :{port} that routes</Text>
        <Text color={COLORS.textDim}>ALL traffic through Tor. Set http_proxy=http://127.0.0.1:{port}</Text>
        <Text color={COLORS.textDim}>in your AI SDK or use `tor-run` for one-off commands.</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text bold color={COLORS.textSecondary}>Usage in AI SDKs:</Text>
        <Text color={COLORS.textDim}>  export HTTP_PROXY=http://127.0.0.1:{port}</Text>
        <Text color={COLORS.textDim}>  npx opencode</Text>
        <Text color={COLORS.textDim}>  # or: torra run -- npx opencode</Text>
      </Box>

      <Select
        options={[
          { label: bridgeActive ? '⏹  Stop Proxy Bridge' : '▶  Start Proxy Bridge', value: 'toggle' },
          { label: '🔙  Back', value: 'back' },
        ]}
        onChange={(v) => {
          if (v === 'back') onBack()
          else toggleBridge()
        }}
        visibleOptionCount={5}
      />
    </Box>
  )
}
