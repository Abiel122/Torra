import React from 'react'
import { Text, Box } from 'ink'
import { Select } from '@inkjs/ui'
import { COLORS } from './theme.js'

export interface MenuOption {
  label: string
  value: string
}

export interface MenuProps {
  options?: MenuOption[]
  onChange: (value: string) => void
}

const menuOptions: MenuOption[] = [
  { label: '🌐  Check IP & Location', value: 'ip' },
  { label: '🔬  IP Leak Test', value: 'leak' },
  { label: '🔄  Rotate IP', value: 'rotate' },
  { label: '⏱   Auto-Rotate IP', value: 'auto-rotate' },
  { label: '🌍  Change Exit Country', value: 'country' },
  { label: '⚙   Service Control', value: 'service' },
  { label: '🧅  AI Proxy Bridge', value: 'bridge' },
  { label: '⛓   Route Table', value: 'route' },
  { label: '📖  How to Use', value: 'help' },
  { label: '🚪  Exit', value: 'exit' },
]

export default function Menu({ onChange }: MenuProps): React.JSX.Element {
  const options = menuOptions.map(o => ({ label: o.label, value: o.value }))

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={COLORS.textDim}>↑↓ navigate  ·  Enter select</Text>
      </Box>
      <Select options={options} onChange={onChange} visibleOptionCount={10} />
    </Box>
  )
}

export { menuOptions }
