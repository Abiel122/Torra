#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# TOR PROXY ALIASES  v2  —  tambah ke ~/.bashrc atau ~/.zshrc
#
# PRINSIP: semua wrapper di sini OPT-IN per command.
# Tidak ada baris di file ini yang men-set http_proxy/https_proxy/
# all_proxy secara global. Jadi npm install, npm run build, npm test,
# python3 script lokal, server lokal (npm run dev, python -m http.server,
# dst) TIDAK PERNAH ikut lewat Tor kecuali kamu panggil wrapper-nya
# secara eksplisit (pcurl, pcpip, pcpython, dst).
# ─────────────────────────────────────────────────────

TOR_SOCKS_PORT=9050
TOR_CONTROL_PORT=9051

# ── Deteksi shell config file ──
detect_shell_rc() {
    if [ -n "$ZSH_VERSION" ]; then
        echo "$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        echo "$HOME/.bashrc"
    else
        echo "$HOME/.profile"
    fi
}

# ── Cek proxychains tersedia ──
check_proxychains() {
    if command -v proxychains4 &>/dev/null; then
        echo "proxychains4"
    elif command -v proxychains &>/dev/null; then
        echo "proxychains"
    else
        echo ""
    fi
}

# ── Install proxychains kalau belum ada ──
install_proxychains() {
    echo "[*] proxychains tidak ditemukan, installing..." >&2
    if command -v apt &>/dev/null; then
        sudo apt install -y proxychains4 2>/dev/null || sudo apt install -y proxychains
    elif command -v pkg &>/dev/null; then
        pkg install -y proxychains-ng || pkg install -y proxychains
    elif command -v yum &>/dev/null; then
        sudo yum install -y proxychains-ng
    elif command -v pacman &>/dev/null; then
        sudo pacman -S --noconfirm proxychains-ng
    else
        echo "[!] Tidak bisa auto-install. Install manual." >&2
        return 1
    fi
    echo "[+] proxychains berhasil diinstall" >&2
}

# ── Cek tor aktif di port socks ──
tor_is_active() {
    (exec 3<>/dev/tcp/127.0.0.1/$TOR_SOCKS_PORT) 2>/dev/null && exec 3<&- 3>&- && return 0
    return 1
}

# ═════════════════════════════════════════════════════
# SETUP / UNSETUP / UNINSTALL
# ═════════════════════════════════════════════════════

# ── Setup: tulis config proxychains, hanya dipakai kalau dipanggil manual ──
pcsetup() {
    local PC
    PC=$(check_proxychains)
    [ -z "$PC" ] && install_proxychains && PC=$(check_proxychains)

    local conf="/etc/proxychains4.conf"
    [ "$PC" = "proxychains" ] && conf="/etc/proxychains.conf"

    sudo tee "$conf" > /dev/null <<'EOF'
strict_chain
quiet_mode
proxy_dns
remote_dns_subnet 224
tcp_read_time_out 15000
tcp_connect_time_out 8000
[ProxyList]
socks5 127.0.0.1 9050
EOF
    echo "[+] Proxychains disetup di $conf (opt-in, tidak otomatis aktif global)."
}

# ── Unsetup: backup config & nonaktifkan, tanpa uninstall package ──
pcunsetup() {
    local any=0
    for conf in /etc/proxychains4.conf /etc/proxychains.conf; do
        if [ -f "$conf" ]; then
            sudo cp "$conf" "${conf}.bak"
            sudo rm -f "$conf"
            echo "[-] $conf dinonaktifkan (backup: ${conf}.bak)"
            any=1
        fi
    done
    [ "$any" -eq 0 ] && echo "[i] Tidak ada config proxychains aktif."
}

# ── Uninstall total proxychains ──
pcuninstall() {
    read -p "Yakin uninstall proxychains sepenuhnya? [y/N] " confirm
    [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && { echo "Dibatalkan."; return; }

    for conf in /etc/proxychains4.conf /etc/proxychains.conf \
                /etc/proxychains4.conf.bak /etc/proxychains.conf.bak; do
        [ -f "$conf" ] && sudo rm -f "$conf"
    done

    if command -v pkg &>/dev/null; then
        pkg uninstall -y proxychains-ng
    else
        sudo apt remove -y proxychains4 proxychains
    fi
    echo "[-] Proxychains diuninstall (package + config)."
}

# ── Uninstall total tor ──
toruninstall() {
    read -p "Yakin uninstall Tor sepenuhnya? [y/N] " confirm
    [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && { echo "Dibatalkan."; return; }

    sudo pkill -x tor 2>/dev/null
    if command -v systemctl &>/dev/null; then
        sudo systemctl stop tor 2>/dev/null
        sudo systemctl disable tor 2>/dev/null
    fi

    if command -v pkg &>/dev/null; then
        pkg uninstall -y tor
    else
        sudo apt remove -y tor
        read -p "Hapus juga config & data Tor (/etc/tor, /var/lib/tor)? [y/N] " rmconf
        if [ "$rmconf" = "y" ] || [ "$rmconf" = "Y" ]; then
            sudo rm -rf /etc/tor /var/lib/tor
        fi
    fi
    echo "[-] Tor diuninstall."
}

# ═════════════════════════════════════════════════════
# WRAPPER PER-COMMAND (opt-in lewat Tor)
# ═════════════════════════════════════════════════════

pcurl() {
    if ! tor_is_active; then
        echo "[!] Tor tidak aktif di port $TOR_SOCKS_PORT. Start tor dulu." >&2
        return 1
    fi
    echo "[tor] curl via native socks5h → $*" >&2
    curl --socks5-hostname 127.0.0.1:$TOR_SOCKS_PORT "$@"
}

pcwget() {
    local PC
    PC=$(check_proxychains)
    [ -z "$PC" ] && install_proxychains && PC=$(check_proxychains)
    if ! tor_is_active; then
        echo "[!] Tor tidak aktif di port $TOR_SOCKS_PORT. Start tor dulu." >&2
        return 1
    fi
    echo "[tor] wget via $PC → $*" >&2
    $PC wget "$@"
}

pcpip() {
    local PC
    PC=$(check_proxychains)
    [ -z "$PC" ] && install_proxychains && PC=$(check_proxychains)
    if ! tor_is_active; then
        echo "[!] Tor tidak aktif. pip akan gagal kalau dipaksa lewat Tor." >&2
        return 1
    fi
    echo "[tor] pip via $PC → $*" >&2
    $PC pip "$@"
}

pcpython() {
    local PC
    PC=$(check_proxychains)
    [ -z "$PC" ] && install_proxychains && PC=$(check_proxychains)
    if ! tor_is_active; then
        echo "[!] Tor tidak aktif. Start tor dulu kalau mau script ini lewat Tor." >&2
        return 1
    fi
    echo "[tor] python3 via $PC → $*" >&2
    $PC python3 "$@"
}

pcnpm() {
    # Disediakan untuk kasus spesifik kamu MEMANG mau npm install -g
    # tertentu lewat Tor. npm biasa (lokal) TETAP pakai `npm` polos, bukan ini.
    local PC
    PC=$(check_proxychains)
    [ -z "$PC" ] && install_proxychains && PC=$(check_proxychains)
    if ! tor_is_active; then
        echo "[!] Tor tidak aktif. Start tor dulu." >&2
        return 1
    fi
    echo "[tor] npm via $PC → $*" >&2
    $PC npm "$@"
}

# ── Cek IP Tor sekarang ──
torip() {
    if ! tor_is_active; then
        echo "[!] Tor tidak aktif." >&2
        return 1
    fi
    echo -n "[tor] IP via Tor: "
    curl -s --socks5-hostname 127.0.0.1:$TOR_SOCKS_PORT --max-time 15 https://api.ipify.org 2>/dev/null \
        || curl -s --socks5-hostname 127.0.0.1:$TOR_SOCKS_PORT --max-time 15 https://ifconfig.me/ip 2>/dev/null
    echo
}

# ── Cek IP asli (native, tanpa proxy) ──
realip() {
    echo -n "[real] IP Asli: "
    curl -s --max-time 8 https://api.ipify.org 2>/dev/null || curl -s --max-time 8 https://ifconfig.me/ip 2>/dev/null
    echo
}

# ── Quick leak check, real-time ──
leakcheck() {
    echo "──────────────────────────"
    REAL=$(curl -s --max-time 8 https://api.ipify.org 2>/dev/null || curl -s --max-time 8 https://ifconfig.me/ip 2>/dev/null)
    echo "  IP Asli  : ${REAL:-gagal}"

    if tor_is_active; then
        TOR=$(curl -s --socks5-hostname 127.0.0.1:$TOR_SOCKS_PORT --max-time 15 https://api.ipify.org 2>/dev/null \
              || curl -s --socks5-hostname 127.0.0.1:$TOR_SOCKS_PORT --max-time 15 https://ifconfig.me/ip 2>/dev/null)
    else
        TOR=""
    fi
    echo "  IP Tor   : ${TOR:-gagal/tor mati}"
    echo "──────────────────────────"

    if [ -n "$TOR" ] && [ "$REAL" != "$TOR" ]; then
        echo "  ✅ AMAN — IP tersembunyi"
    elif [ -n "$TOR" ] && [ "$REAL" = "$TOR" ]; then
        echo "  🚨 LEAK! IP bocor — traffic ini tidak benar-benar lewat Tor"
    else
        echo "  ⚠  Tor tidak aktif / gagal konek"
    fi
    echo "──────────────────────────"
}

# ── Sanity check: pastikan tidak ada proxy global ke-set tanpa sengaja ──
pccheck_env() {
    local found=0
    for v in http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY; do
        if [ -n "${!v}" ]; then
            echo "[!] $v=${!v} (proxy global AKTIF — ini akan mempengaruhi semua command polos!)"
            found=1
        fi
    done
    if [ "$found" -eq 0 ]; then
        echo "[+] Tidak ada proxy global di environment. npm/pip/python/server lokal aman native."
    else
        echo "[i] Jalankan: unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY"
    fi
}

echo "[tor-aliases] Loaded: pcurl pcwget pcpip pcpython pcnpm torip realip leakcheck pccheck_env"
echo "[tor-aliases] Setup:  pcsetup pcunsetup pcuninstall toruninstall"
