#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import App from './app.js'

async function main() {
  const { waitUntilExit } = render(<App />)
  await waitUntilExit()
}

main().catch((err) => {
  console.error('Torra fatal error:', err)
  process.exit(1)
})
