import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Text, Box } from 'ink'
import { ConfirmInput } from '@inkjs/ui'
import Spinner from '../spinner.js'
import { rotateIp } from '../../core/circuit.js'
import { getIpInfo } from '../../core/ip.js'
import { isCircuitLocked } from '../../core/circuit.js'
import { loadState } from '../../state/store.js'
import { COLORS } from '../theme.js'

export default function AutoRotatePanel({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [running, setRunning] = useState(false)
  const [counter, setCounter] = useState(0)
  const [interval, setInterval_] = useState(loadState().autoRotateInterval)
  const [countdown, setCountdown] = useState(0)
  const [currentIp, setCurrentIp] = useState<string | null>(null)
  const [currentCountry, setCurrentCountry] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const runningRef = useRef(false)

  const rotate = useCallback(async () => {
    try {
      await rotateIp(true)
      const info = await getIpInfo(true)
      if (info) {
        setCurrentIp(info.ip || null)
        setCurrentCountry(info.country || null)
      }
      setCounter(c => c + 1)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!running) return
    runningRef.current = true

    const doCycle = async () => {
      setCountdown(0)
      await rotate()

      if (!runningRef.current) return

      for (let i = interval; i > 0; i--) {
        if (!runningRef.current) return
        setCountdown(i)
        await new Promise(r => setTimeout(r, 1000))
      }

      if (runningRef.current) {
        doCycle()
      }
    }

    doCycle()

    return () => {
      runningRef.current = false
    }
  }, [running, interval, rotate])

  useEffect(() => {
    if (isCircuitLocked()) {
      setRunning(false)
      setFinished(true)
    }
  }, [])

  if (finished) {
    return (
      <Box flexDirection="column">
        <Text color={COLORS.warning}>⚠ Circuit is locked. Unlock from Service Control first.</Text>
        <Box marginTop={1}>
          <ConfirmInput onConfirm={() => onBack()} onCancel={() => {}} />
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={COLORS.accentCyan}>⏱ Auto-Rotate IP</Text>
      </Box>

      {!running ? (
        <Box flexDirection="column">
          <Text>Interval: <Text bold>{interval}s</Text></Text>
          <Text color={COLORS.textDim}>Press ENTER to start, or any key to cancel.</Text>
          <Box marginTop={1}>
            <ConfirmInput
              onConfirm={() => setRunning(true)}
              onCancel={() => onBack()}
            />
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text bold color={COLORS.success}>🔄 Running — Press Ctrl+C to stop</Text>
          <Text>Rotations: <Text bold>{counter}</Text></Text>
          {countdown > 0 && <Text>Next rotation in: <Text bold>{countdown}s</Text></Text>}
          {currentIp && <Text>Current IP: <Text color={COLORS.accentCyan}>{currentIp}</Text> {currentCountry && `(${currentCountry})`}</Text>}
        </Box>
      )}
    </Box>
  )
}
