# Torra v4 — Tor Anonymous Manager

**CLI TUI** untuk manajemen Tor + proxy bridge AI — dibangun dengan **TypeScript** dan **Ink** (React untuk CLI).

```
17 Jun 2026 | 23:50:44                                           ╔╦╗╔═╗╦═╗╦═╗╔═╗
                                                                 ║║║║╠╦╝╠╦╝╠═╣
                                                                 ╩╚╝╩╚═╩╚═╩ ╩
                              TOR ANONYMOUS MANAGER
                    ● TOR ACTIVE  ● PROXY BRIDGE ON  🔒 LOCKED
```

## Fitur

| Fitur | Status |
|---|---|
| TUI interaktif dengan navigasi ↑↓ (Ink/React) | ✅ |
| Banner real-time dengan jam live | ✅ |
| Service Control (start/stop/restart Tor) | ✅ |
| IP Detection (real IP + Tor IP + ipinfo.io) | ✅ |
| IP Leak Test real-time | ✅ |
| Rotasi IP (NEWNYM) + auto-rotate | ✅ |
| Ganti Exit Country (template-based, rollback otomatis) | ✅ |
| Circuit Lock (cegah auto-rotate IP) | ✅ |
| Proxychains setup/uninstall | ✅ |
| **AI Proxy Bridge** (HTTP CONNECT → SOCKS5 → Tor) | ✅ **NEW** |
| **Route Table** (opencode→Tor, 9router→native) | ✅ **NEW** |
| **tor-run** universal (jalanin command apapun via Tor) | ✅ **NEW** |
| Wrappers TypeScript (pcurl, pcpip, dll) | ✅ **NEW** |

## Routing System

| Binary | Mode | Proxy |
|---|---|---|
| `opencode` | **SOCKS5 env** → Tor :9050 | ✅ Full anonymity |
| `9router` | **NATIVE** | ❌ No proxy (original routing) |
| `pcurl` | SOCKS5 → Tor | ✅ |
| `pcpip` / `pcpython` / `pcnpm` | SOCKS5 → Tor | ✅ |
| `tor-run <cmd>` | Auto-detect best route | ✅ |

## Instalasi

```bash
# Clone repo
git clone https://github.com/Abiel122/Torra.git
cd Torra

# Install dependencies & build
npm install
npm run build

# Jalankan
node dist/cli.js

# Install global (agar bisa akses dari mana saja)
./install.sh
```

Atau langsung:

```bash
npm install -g torra
torra
```

## Command Reference

```
torra                     # UI menu utama (interaktif)
pcurl <url>               # curl via Tor
pcpip install <pkg>       # pip via Tor
pcpython <script>         # python via Tor
pcnpm <args>              # npm via Tor
opencode <args>           # opencode via Tor (anonim total)
9router <args>            # 9router native (no proxy)
tor-run <cmd> [args]      # jalankan command apapun via Tor
torip                     # cek IP Tor
realip                    # cek IP asli
leakcheck                 # leak test (bandingkan IP)
```

## AI Proxy Bridge

Untuk AI SDK yang tidak support SOCKS5:

```bash
# Dari UI: AI Proxy Bridge → Start
# atau langsung:
export http_proxy=http://127.0.0.1:8080
export https_proxy=http://127.0.0.1:8080
npx opencode               # sekarang via Tor!

# Alternatif: pakai opencode wrapper langsung
opencode "hello"           # auto SOCKS5 via Tor
```

## Tech Stack

| Layer | Teknologi |
|---|---|
| UI | Ink (React for CLI) + @inkjs/ui |
| Runtime | Node.js 18+ / TypeScript |
| Build | tsup |
| Proxy Bridge | socks-proxy-agent + http-proxy |
| State | conf (JSON di ~/.torra/config.json) |
| Process | execa |

## Keamanan

- **No global proxy** — npm/pip/python lokal tetap native
- **DNS via Tor** — pakai `socks5h://` (DNS lewat Tor)
- **Circuit Lock** — cegah rotasi IP tidak sengaja
- **Rollback otomatis** — gagal ganti negara? config balik ke backup
- **Route isolation** — opencode via Tor, 9router native (terpisah)

## Migrasi dari v3 (Python)

Hapus file lama dan install ulang:

```bash
rm -rf ~/.tor-manager
# hapus blok tor-manager dari ~/.bashrc
# lalu install Torra v4
```
