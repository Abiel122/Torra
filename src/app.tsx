import React, { useState, useEffect, useCallback } from 'react'
import { Box } from 'ink'
import Banner from './ui/banner.js'
import StatusBar from './ui/status-bar.js'
import Menu from './ui/menu.js'
import IpPanel from './ui/panels/ip-panel.js'
import LeakPanel from './ui/panels/leak-panel.js'
import CountryPanel from './ui/panels/country-panel.js'
import ServicePanel from './ui/panels/service-panel.js'
import AutoRotatePanel from './ui/panels/auto-rotate-panel.js'
import ProxyBridgePanel from './ui/panels/proxy-bridge-panel.js'
import RoutePanel from './ui/panels/route-panel.js'
import HelpPanel from './ui/panels/help-panel.js'
import { torStatus } from './core/tor.js'
import { isBridgeRunning } from './proxy/bridge.js'
import { isCircuitLocked } from './core/circuit.js'
import { loadState } from './state/store.js'

type Page = 'menu' | 'ip' | 'leak' | 'rotate' | 'auto-rotate' | 'country' | 'service' | 'bridge' | 'route' | 'help'

export default function App(): React.JSX.Element {
  const [page, setPage] = useState<Page>('menu')
  const [torActive, setTorActive] = useState(false)
  const [bridgeActive, setBridgeActive] = useState(false)
  const [circuitLocked, setCircuitLocked] = useState(false)

  const refreshStatus = useCallback(async () => {
    const [t, b, c] = await Promise.all([
      torStatus(),
      Promise.resolve(isBridgeRunning()),
      Promise.resolve(isCircuitLocked()),
    ])
    setTorActive(t)
    setBridgeActive(b)
    setCircuitLocked(c)
  }, [])

  useEffect(() => {
    refreshStatus()
    const timer = setInterval(refreshStatus, 5000)
    return () => clearInterval(timer)
  }, [refreshStatus])

  function navigate(value: string) {
    switch (value) {
      case 'ip': setPage('ip'); break
      case 'leak': setPage('leak'); break
      case 'rotate':
        import('./core/circuit.js').then(m => m.rotateIp()).catch(() => {})
        break
      case 'auto-rotate': setPage('auto-rotate'); break
      case 'country': setPage('country'); break
      case 'service': setPage('service'); break
      case 'bridge': setPage('bridge'); break
      case 'route': setPage('route'); break
      case 'help': setPage('help'); break
      case 'exit': process.exit(0)
    }
  }

  const state = loadState()

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Banner />
      <StatusBar
        torActive={torActive}
        proxyBridgeActive={bridgeActive}
        circuitLocked={circuitLocked}
        exitCountry={state.exitCountry}
      />

      {page === 'menu' && <Menu onChange={navigate} />}
      {page === 'ip' && <IpPanel onBack={() => { setPage('menu'); refreshStatus() }} />}
      {page === 'leak' && <LeakPanel onBack={() => { setPage('menu'); refreshStatus() }} />}
      {page === 'country' && <CountryPanel onBack={() => { setPage('menu'); refreshStatus() }} />}
      {page === 'service' && <ServicePanel onBack={() => { setPage('menu'); refreshStatus() }} />}
      {page === 'auto-rotate' && <AutoRotatePanel onBack={() => { setPage('menu'); refreshStatus() }} />}
      {page === 'bridge' && <ProxyBridgePanel onBack={() => { setPage('menu'); refreshStatus() }} />}
      {page === 'route' && <RoutePanel onBack={() => { setPage('menu'); refreshStatus() }} />}
      {page === 'help' && <HelpPanel onBack={() => { setPage('menu') }} />}
    </Box>
  )
}
