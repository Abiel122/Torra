#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Tor Anonymous Manager — Installer
#
# Penggunaan:
#   curl -fsSL https://raw.githubusercontent.com/<user>/Torra/main/install.sh | bash
#   atau lokal:
#   bash install.sh
#
# Script ini HANYA:
#   1. Cek dependency dasar (python3, pip, git/curl)
#   2. Download tor_manager.py & tor_aliases.sh ke ~/.tor-manager/
#   3. Tambah satu baris "source" ke .bashrc/.zshrc (supaya wrapper
#      pcurl/pcpip/dst tersedia di shell baru)
#   4. TIDAK menginstall tor/proxychains secara otomatis di sini —
#      itu ditangani interaktif oleh tor_manager.py saat dijalankan
#      pertama kali (biar kamu yang konfirmasi, bukan auto-install
#      diam-diam lewat curl|bash).
#   5. TIDAK menyentuh environment proxy global (http_proxy/https_proxy).
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

REPO_RAW_BASE="${TOR_MANAGER_RAW_BASE:-https://raw.githubusercontent.com/Abiel122/Torra/main}"
INSTALL_DIR="${TOR_MANAGER_DIR:-$HOME/.tor-manager}"
BIN_LINK="$HOME/.local/bin/tor-manager"

c_green() { printf '\033[32m%s\033[0m\n' "$1"; }
c_yellow() { printf '\033[33m%s\033[0m\n' "$1"; }
c_red() { printf '\033[31m%s\033[0m\n' "$1"; }
c_cyan() { printf '\033[36m%s\033[0m\n' "$1"; }

c_cyan "═══════════════════════════════════════════"
c_cyan "  Tor Anonymous Manager — Installer"
c_cyan "═══════════════════════════════════════════"
echo

# ── 1. Cek dependency dasar ──
need_cmd() {
    if ! command -v "$1" &>/dev/null; then
        c_red "[!] '$1' tidak ditemukan. Install dulu sebelum lanjut."
        exit 1
    fi
}

c_yellow "[*] Mengecek dependency dasar..."
need_cmd python3
need_cmd curl
PY_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "    python3 versi: $PY_VERSION"

if ! command -v pip3 &>/dev/null && ! python3 -m pip --version &>/dev/null; then
    c_yellow "[!] pip tidak ditemukan, mencoba ensurepip..."
    python3 -m ensurepip --upgrade || {
        c_red "[!] Gagal menyiapkan pip. Install pip manual lalu jalankan ulang."
        exit 1
    }
fi
c_green "[+] Dependency dasar OK."
echo

# ── 2. Siapkan folder install ──
c_yellow "[*] Menyiapkan folder install di $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR"

fetch_file() {
    local name="$1"
    local dest="$INSTALL_DIR/$name"
    if [ -f "./$name" ]; then
        # Mode lokal: kalau file sudah ada di direktori saat ini, salin saja
        cp "./$name" "$dest"
        echo "    [local] $name disalin dari direktori saat ini"
    else
        # Mode remote: download dari repo
        curl -fsSL "$REPO_RAW_BASE/$name" -o "$dest" || {
            c_red "[!] Gagal download $name dari $REPO_RAW_BASE"
            exit 1
        }
        echo "    [remote] $name diunduh dari repo"
    fi
}

fetch_file "tor_manager.py"
fetch_file "tor_aliases.sh"

chmod +x "$INSTALL_DIR/tor_manager.py"
chmod +x "$INSTALL_DIR/tor_aliases.sh"
c_green "[+] File terpasang di $INSTALL_DIR"
echo

# ── 3. Buat launcher pendek ──
mkdir -p "$HOME/.local/bin"
cat > "$BIN_LINK" <<EOF
#!/usr/bin/env bash
exec python3 "$INSTALL_DIR/tor_manager.py" "\$@"
EOF
chmod +x "$BIN_LINK"
c_green "[+] Launcher dibuat: tor-manager (pastikan ~/.local/bin ada di \$PATH)"
echo

# ── 4. Hook ke shell rc (HANYA source aliases, bukan set proxy) ──
detect_rc() {
    if [ -n "${ZSH_VERSION:-}" ]; then
        echo "$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        echo "$HOME/.bashrc"
    else
        echo "$HOME/.profile"
    fi
}

RC_FILE=$(detect_rc)
MARKER="# >>> tor-manager aliases >>>"
END_MARKER="# <<< tor-manager aliases <<<"

if [ -f "$RC_FILE" ] && grep -qF "$MARKER" "$RC_FILE" 2>/dev/null; then
    c_yellow "[i] Hook sudah ada di $RC_FILE, skip."
else
    {
        echo ""
        echo "$MARKER"
        echo "# Wrapper opt-in (pcurl, pcpip, pcpython, torip, realip, leakcheck, dst)"
        echo "# Tidak men-set proxy global — npm/pip/python lokal tetap native."
        echo "[ -f \"$INSTALL_DIR/tor_aliases.sh\" ] && source \"$INSTALL_DIR/tor_aliases.sh\""
        echo "$END_MARKER"
    } >> "$RC_FILE"
    c_green "[+] Hook ditambahkan ke $RC_FILE"
fi
echo

c_cyan "═══════════════════════════════════════════"
c_green "  Instalasi selesai!"
c_cyan "═══════════════════════════════════════════"
echo
echo "Langkah selanjutnya:"
echo "  1. Reload shell:   source $RC_FILE"
echo "  2. Jalankan UI:    tor-manager"
echo "     (atau langsung: python3 $INSTALL_DIR/tor_manager.py)"
echo "  3. Wrapper opt-in siap dipakai: pcurl, pcpip, pcpython, torip, realip, leakcheck"
echo
c_yellow "Catatan: tor & proxychains BELUM diinstall oleh script ini."
c_yellow "Saat 'tor-manager' dijalankan pertama kali, ia akan cek & tawarkan"
c_yellow "install tor/proxychains secara interaktif (kamu yang konfirmasi)."
echo
