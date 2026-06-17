import React from 'react'
import { Text, Box } from 'ink'
import { ConfirmInput } from '@inkjs/ui'
import { COLORS } from '../theme.js'

export default function HelpPanel({ onBack }: { onBack: () => void }): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={COLORS.accentCyan}>📖 How to Use Torra</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={COLORS.textSecondary}>🛡 Tor Proxy Wrappers (opt-in per command):</Text>
        <Text color={COLORS.textDim}>{'  pcurl <url>        — curl through Tor'}</Text>
        <Text color={COLORS.textDim}>{'  pcpip <pkg>        — pip install through Tor'}</Text>
        <Text color={COLORS.textDim}>{'  pcpython <script>  — python through Tor'}</Text>
        <Text color={COLORS.textDim}>{'  pcnpm <args>       — npm through Tor'}</Text>
        <Text color={COLORS.textDim}>{'  pcwget <url>       — wget through Tor'}</Text>
        <Text color={COLORS.textDim}>  torip              — show Tor IP</Text>
        <Text color={COLORS.textDim}>  realip             — show real IP</Text>
        <Text color={COLORS.textDim}>  leakcheck          — compare IPs</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={COLORS.textSecondary}>🧅 AI Proxy Bridge:</Text>
        <Text color={COLORS.textDim}>  1. Start Tor from Service Control</Text>
        <Text color={COLORS.textDim}>  2. Start Proxy Bridge from AI Proxy Bridge menu</Text>
        <Text color={COLORS.textDim}>  3. Set http_proxy=http://127.0.0.1:8080 in your terminal</Text>
        <Text color={COLORS.textDim}>  4. Or use: torra run -- opencode</Text>
        <Text color={COLORS.textDim}>  5. opencode commands run via SOCKS5 Tor automatically</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={COLORS.textSecondary}>🌐 Routing:</Text>
        <Text color={COLORS.textDim}>  • opencode   → SOCKS5 env → Tor (anonymous)</Text>
        <Text color={COLORS.textDim}>  • 9router    → NATIVE     (original routing)</Text>
        <Text color={COLORS.textDim}>  • tor-run    → auto-detect best route</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={COLORS.textSecondary}>🔒 For maximum anonymity:</Text>
        <Text color={COLORS.textDim}>  • Lock circuit to prevent IP rotation</Text>
        <Text color={COLORS.textDim}>  • Set exit country to your region</Text>
        <Text color={COLORS.textDim}>  • Use Proxy Bridge for AI SDKs</Text>
        <Text color={COLORS.textDim}>  • Check leak test before sensitive work</Text>
        <Text color={COLORS.textDim}>  • DNS resolved via Tor (socks5h://)</Text>
      </Box>

      <Box marginTop={1}>
        <ConfirmInput onConfirm={() => onBack()} onCancel={() => {}} />
      </Box>
    </Box>
  )
}
