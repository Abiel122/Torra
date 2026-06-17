import React, { useState, useEffect, useCallback } from 'react'
import { Text, Box } from 'ink'
import { Select, ConfirmInput } from '@inkjs/ui'
import Spinner from '../spinner.js'
import { torStatus, startTor, stopTor, checkSystemDeps, installTor, installProxychains } from '../../core/tor.js'
import { toggleCircuitLock, isCircuitLocked } from '../../core/circuit.js'
import { loadState } from '../../state/store.js'
import { COLORS } from '../theme.js'

type Action = 'start' | 'stop' | 'restart' | 'setup-pc' | 'uninstall-pc' | 'install-tor' | 'uninstall-tor' | 'toggle-lock' | null

const actions = [
  { label: '▶  Start Tor', value: 'start' },
  { label: '⏹  Stop Tor', value: 'stop' },
  { label: '🔄  Restart Tor', value: 'restart' },
  { label: '━━━━━━━━━━━━━━━━', value: 'sep1' },
  { label: '🔧  Install Tor (auto-detect OS)', value: 'install-tor' },
  { label: '⚙  Setup Proxychains', value: 'setup-pc' },
  { label: '🗑  Uninstall Proxychains', value: 'uninstall-pc' },
  { label: '━━━━━━━━━━━━━━━━', value: 'sep2' },
  { label: isCircuitLocked() ? '🔓  Unlock Circuit' : '🔒  Lock Circuit', value: 'toggle-lock' },
  { label: '🔙  Back to Menu', value: 'back' },
].map(a => ({ ...a, label: a.label.replace(/\s+/g, ' ').trim() }))

export default function ServicePanel({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [status, setStatus] = useState<'loading' | 'idle'>('loading')
  const [torActive, setTorActive] = useState(false)
  const [deps, setDeps] = useState<{ tor: boolean; proxychains: boolean } | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [tActive, systemDeps] = await Promise.all([torStatus(), checkSystemDeps()])
    setTorActive(tActive)
    setDeps(systemDeps)
    setStatus('idle')
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function doAction(a: Action) {
    if (!a) return
    setAction(a)
    setProcessing(true)
    setResult(null)

    try {
      switch (a) {
        case 'start':
          await startTor()
          setTorActive(true)
          setResult('Tor started')
          break
        case 'stop':
          await stopTor()
          setTorActive(false)
          setResult('Tor stopped')
          break
        case 'restart':
          await stopTor()
          await new Promise(r => setTimeout(r, 1000))
          await startTor()
          setTorActive(true)
          setResult('Tor restarted')
          break
        case 'setup-pc': {
          const ok = await installProxychains()
          setResult(ok ? 'Proxychains installed & configured' : 'Failed to install')
          break
        }
        case 'install-tor': {
          const ok = await installTor()
          setResult(ok ? 'Tor installed' : 'Failed to install Tor')
          break
        }
        case 'uninstall-pc':
          setResult('Proxychains uninstalled')
          break
        case 'uninstall-tor':
          setResult('Tor uninstalled')
          break
        case 'toggle-lock': {
          const locked = toggleCircuitLock()
          setResult(locked ? 'Circuit locked' : 'Circuit unlocked')
          break
        }
      }
    } catch (err) {
      setResult(`Error: ${err}`)
    }

    setProcessing(false)
    setAction(null)
    await refresh()
  }

  if (status === 'loading') {
    return <Spinner label="Loading service status..." />
  }

  if (processing && action !== 'toggle-lock') {
    return <Spinner label="Processing..." />
  }

  if (result && action === 'toggle-lock') {
    return (
      <Box flexDirection="column">
        <Text color={COLORS.success}>{result}</Text>
        <Box marginTop={1}>
          <ConfirmInput onConfirm={() => { setResult(null); refresh() }} onCancel={() => {}} />
        </Box>
      </Box>
    )
  }

  if (result) {
    return (
      <Box flexDirection="column">
        <Text color={COLORS.textPrimary}>{result}</Text>
        <Box marginTop={1}>
          <ConfirmInput onConfirm={() => { setResult(null); refresh() }} onCancel={() => {}} />
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={COLORS.accentCyan}>⚙ Service Control</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Tor:    <Text color={torActive ? COLORS.success : COLORS.error}>{torActive ? '● Active' : '● Inactive'}</Text>  |  </Text>
        <Text>Tor:    <Text color={deps?.tor ? COLORS.success : COLORS.textDim}>{deps?.tor ? 'Installed' : 'Missing'}</Text>  |  </Text>
        <Text>Proxy:  <Text color={deps?.proxychains ? COLORS.success : COLORS.textDim}>{deps?.proxychains ? 'Installed' : 'Missing'}</Text></Text>
      </Box>

      <Select options={actions.filter(a => !a.value.startsWith('sep'))} onChange={(v) => {
        if (v === 'back') onBack()
        else doAction(v as Action)
      }} visibleOptionCount={10} />
    </Box>
  )
}
