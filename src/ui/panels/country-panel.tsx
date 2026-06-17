import React, { useState } from 'react'
import { Text, Box } from 'ink'
import { Select, ConfirmInput } from '@inkjs/ui'
import Spinner from '../spinner.js'
import { COLORS } from '../theme.js'
import { changeExitCountry } from '../../core/torrc.js'

const COUNTRIES = [
  { label: '🇺🇸  United States', value: 'us' },
  { label: '🇨🇦  Canada', value: 'ca' },
  { label: '🇩🇪  Germany', value: 'de' },
  { label: '🇫🇷  France', value: 'fr' },
  { label: '🇬🇧  United Kingdom', value: 'gb' },
  { label: '🇸🇬  Singapore', value: 'sg' },
  { label: '🇯🇵  Japan', value: 'jp' },
  { label: '🇦🇺  Australia', value: 'au' },
  { label: '🇳🇱  Netherlands', value: 'nl' },
  { label: '🇸🇪  Sweden', value: 'se' },
  { label: '🇳🇴  Norway', value: 'no' },
  { label: '🇫🇮  Finland', value: 'fi' },
  { label: '🇳🇿  New Zealand', value: 'nz' },
  { label: '🇧🇷  Brazil', value: 'br' },
  { label: '🇲🇽  Mexico', value: 'mx' },
  { label: '🇨🇭  Switzerland', value: 'ch' },
  { label: '🇦🇹  Austria', value: 'at' },
  { label: '🇨🇿  Czech Republic', value: 'cz' },
  { label: '🇷🇴  Romania', value: 'ro' },
  { label: '🇵🇱  Poland', value: 'pl' },
  { label: '🔓  No preference (default)', value: 'none' },
]

export default function CountryPanel({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [step, setStep] = useState<'select' | 'confirm' | 'applying' | 'done' | 'error'>('select')
  const [selected, setSelected] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function applyCountry(code: string | null) {
    setStep('applying')
    try {
      const ok = await changeExitCountry(code)
      setStep(ok ? 'done' : 'error')
      if (!ok) setErrorMsg('Failed to apply. Tor may not be installed.')
    } catch (err) {
      setStep('error')
      setErrorMsg(String(err))
    }
  }

  if (step === 'select') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={COLORS.accentCyan}>🌍 Select Exit Country</Text>
        </Box>
        <Text color={COLORS.textDim}>Changing country will restart Tor with a new circuit.</Text>
        <Box marginTop={1}>
          <Select options={COUNTRIES} onChange={(v) => { setSelected(v); setStep('confirm') }} visibleOptionCount={10} />
        </Box>
      </Box>
    )
  }

  if (step === 'confirm') {
    const label = COUNTRIES.find(c => c.value === selected)?.label || selected || 'none'
    return (
      <Box flexDirection="column">
        <Text>Change exit country to: <Text bold color={COLORS.accentCyan}>{label}</Text></Text>
        <Text color={COLORS.warning}>⚠ This will restart Tor. Current connection will be disrupted.</Text>
        <Box marginTop={1}>
          <ConfirmInput
            onConfirm={() => applyCountry(selected === 'none' ? null : selected)}
            onCancel={() => setStep('select')}
          />
        </Box>
      </Box>
    )
  }

  if (step === 'applying') {
    return <Spinner label="Changing exit country and restarting Tor..." />
  }

  if (step === 'error') {
    return (
      <Box flexDirection="column">
        <Text bold color={COLORS.error}>✗ Error: {errorMsg}</Text>
        <Box marginTop={1}>
          <ConfirmInput onConfirm={() => onBack()} onCancel={() => {}} />
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text bold color={COLORS.success}>✓ Exit country changed successfully!</Text>
      <Text color={COLORS.textDim}>New circuit created.</Text>
      <Box marginTop={1}>
        <ConfirmInput onConfirm={() => onBack()} onCancel={() => {}} />
      </Box>
    </Box>
  )
}
