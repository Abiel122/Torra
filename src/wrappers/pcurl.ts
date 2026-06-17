#!/usr/bin/env node
import { execa } from 'execa'
import { loadState } from '../state/store.js'

const args = process.argv.slice(2)
const state = loadState()
const proxyUrl = `socks5h://127.0.0.1:${state.torSocksPort}`

const env = {
  ...process.env,
  HTTP_PROXY: proxyUrl,
  HTTPS_PROXY: proxyUrl,
  ALL_PROXY: proxyUrl,
}

execa('curl', args, { stdio: 'inherit', env, reject: false })
