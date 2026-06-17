import React, { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import Gradient from 'ink-gradient'
import { COLORS, GRADIENT_BANNER, GRADIENT_TITLE, BANNER_ART } from './theme.js'

function formatDate(): string {
  const d = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${dd} ${months[d.getMonth()]} ${d.getFullYear()} | ${hh}:${mm}:${ss}`
}

export default function Banner(): React.JSX.Element {
  const [time, setTime] = useState(formatDate)

  useEffect(() => {
    const timer = setInterval(() => setTime(formatDate()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box justifyContent="space-between" width="100%">
        <Text color={COLORS.textSecondary}>{time}</Text>
        <Gradient colors={GRADIENT_BANNER}>
          <Box flexDirection="column" alignItems="flex-end">
            {BANNER_ART.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </Box>
        </Gradient>
      </Box>
      <Gradient colors={GRADIENT_TITLE}>
        <Text bold>TOR ANONYMOUS MANAGER</Text>
      </Gradient>
    </Box>
  )
}
