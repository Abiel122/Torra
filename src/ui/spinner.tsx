import React from 'react'
import { Text, Box } from 'ink'
import { Spinner as InkSpinner } from '@inkjs/ui'
import { COLORS } from './theme.js'

export default function Spinner({ label }: { label: string }): React.JSX.Element {
  return (
    <Box>
      <InkSpinner label="" />
      <Text color={COLORS.textPrimary}>{label}</Text>
    </Box>
  )
}
