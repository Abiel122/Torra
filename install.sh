#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Torra v4 — TypeScript Tor Anonymous Manager
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

INSTALL_DIR="${TORRA_DIR:-$HOME/.torra}"
BIN_DIR="$HOME/.local/bin"

c_green() { printf '\033[32m%s\033[0m\n' "$1"; }
c_yellow() { printf '\033[33m%s\033[0m\n' "$1"; }
c_cyan() { printf '\033[36m%s\033[0m\n' "$1"; }
c_red() { printf '\033[31m%s\033[0m\n' "$1"; }

c_cyan "═══════════════════════════════════════════"
c_cyan "  Torra v4 — Installer"
c_cyan "═══════════════════════════════════════════"
echo

# ── Cek Node.js ──
c_yellow "[*] Checking Node.js..."
if ! command -v node &>/dev/null; then
    c_red "[!] Node.js 18+ not found. Install it first:"
    c_red "    https://nodejs.org/"
    exit 1
fi
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
    c_red "[!] Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
c_green "[+] Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
    c_red "[!] npm not found."
    exit 1
fi
c_green "[+] npm $(npm -v)"
echo

# ── Clone / Copy files ──
c_yellow "[*] Installing to $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR"

if [ -d "./node_modules" ] && [ -f "./package.json" ]; then
    cp -r ./* "$INSTALL_DIR/" 2>/dev/null || true
    cp -r ./.* "$INSTALL_DIR/" 2>/dev/null || true
    c_green "[+] Files copied from current directory"
else
    # Clone from repo
    REPO="${TORRA_REPO:-https://github.com/Abiel122/Torra.git}"
    c_yellow "[*] Cloning from $REPO ..."
    if command -v git &>/dev/null; then
        git clone --depth 1 "$REPO" "$INSTALL_DIR" 2>&1
    else
        c_red "[!] git not found. Install git or copy files manually."
        exit 1
    fi
fi

# ── Install dependencies & build ──
c_yellow "[*] Installing dependencies..."
cd "$INSTALL_DIR"
npm install --production 2>&1 | tail -3
c_yellow "[*] Building..."
npm run build 2>&1 | tail -3
c_green "[+] Build complete!"
echo

# ── Create symlinks ──
c_yellow "[*] Creating symlinks in $BIN_DIR ..."
mkdir -p "$BIN_DIR"

for cmd in torra pcurl pcpip pcpython pcnpm pcwget opencode 9router tor-run torip realip leakcheck; do
    if [ -f "$INSTALL_DIR/dist/cli.js" ] || [ "$cmd" = "torra" ]; then
        ln -sf "$INSTALL_DIR/dist/${cmd}.js" "$BIN_DIR/$cmd" 2>/dev/null || true
    fi
done

# Actually, all binaries are in wrappers/ except torra
ln -sf "$INSTALL_DIR/dist/cli.js" "$BIN_DIR/torra"
for cmd in pcurl pcpip pcpython pcnpm pcwget opencode 9router tor-run torip realip leakcheck; do
    ln -sf "$INSTALL_DIR/dist/wrappers/${cmd}.js" "$BIN_DIR/${cmd}" 2>/dev/null || true
done

chmod +x "$BIN_DIR"/* 2>/dev/null || true
c_green "[+] Symlinks created!"
echo

# ── Shell RC hook ──
detect_rc() {
    if [ -n "${ZSH_VERSION:-}" ]; then echo "$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then echo "$HOME/.bashrc"
    else echo "$HOME/.profile"
    fi
}

RC_FILE=$(detect_rc)
MARKER="# >>> torra aliases >>>"
END_MARKER="# <<< torra aliases <<<"

if [ -f "$RC_FILE" ] && grep -qF "$MARKER" "$RC_FILE" 2>/dev/null; then
    c_yellow "[i] Hook already in $RC_FILE, skip."
else
    {
        echo ""
        echo "$MARKER"
        echo "# Torra v4 — opt-in proxy wrappers"
        echo "# Tor/proxychains NOT set globally. Local dev stays native."
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo "$END_MARKER"
    } >> "$RC_FILE"
    c_green "[+] PATH hook added to $RC_FILE"
fi
echo

c_cyan "═══════════════════════════════════════════"
c_green "  Torra v4 installed!"
c_cyan "═══════════════════════════════════════════"
echo
echo "  Run:  torra"
echo "  Or:   source $RC_FILE && torra"
echo
echo "  Wrappers (opt-in Tor commands):"
echo "    pcurl, pcpip, pcpython, pcnpm, pcwget"
echo "    opencode (SOCKS5 → Tor), 9router (native)"
echo "    torip, realip, leakcheck, tor-run"
echo
