import http from 'node:http'
import net from 'node:net'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { loadState } from '../state/store.js'

let server: http.Server | null = null

export function isBridgeRunning(): boolean {
  return server !== null && server.listening
}

export function startBridge(port = 8080): Promise<void> {
  return new Promise((resolve, reject) => {
    const state = loadState()
    const targetUrl = `socks5h://127.0.0.1:${state.torSocksPort}`
    const socksAgent = new SocksProxyAgent(targetUrl)

    server = http.createServer((req, res) => {
      if (!req.url) { res.writeHead(400); res.end(); return }

      const options = {
        method: req.method,
        path: req.url,
        headers: req.headers,
        agent: socksAgent as never,
      }

      const proxyReq = http.request(req.url, options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
        proxyRes.pipe(res, { end: true })
      })

      proxyReq.on('error', () => {
        res.writeHead(502)
        res.end('Bridge error')
      })

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        req.pipe(proxyReq, { end: true })
      } else {
        proxyReq.end()
      }
    })

    server.on('connect', (req, clientSocket, head) => {
      const [host, portStr] = (req.url || ':80').split(':')
      const targetPort = parseInt(portStr || '80', 10)

      const targetSocket = net.createConnection({ host, port: targetPort, timeout: 10000 }, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        targetSocket.write(head)
        targetSocket.pipe(clientSocket)
        clientSocket.pipe(targetSocket)
      })

      targetSocket.on('error', () => {
        clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n')
        clientSocket.end()
      })

      clientSocket.on('error', () => targetSocket.end())
    })

    server.listen(port, '127.0.0.1', () => {
      resolve()
    })

    server.on('error', reject)
  })
}

export function stopBridge(): void {
  if (server) {
    server.close()
    server = null
  }
}
