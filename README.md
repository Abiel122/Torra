# Tor Anonymous Manager

CLI manager untuk Tor dengan UI berbasis [Rich](https://github.com/Textualize/rich): cek IP, leak test real-time, kontrol service, ganti exit country, dan rotasi IP — dengan proxychains yang **opt-in per command**, bukan default global.

## Prinsip Desain

Proxychains **tidak pernah** diterapkan secara global ke environment. Artinya:

- `npm install`, `npm run build`, `npm test`, server lokal (`npm run dev`, `python -m http.server`, dll) — semua tetap jalan **native**, tidak lewat Tor.
- Proxychains hanya aktif saat dipanggil manual sebagai prefix command (`proxychains4 <cmd>`) atau lewat wrapper singkat (`pcurl`, `pcpip`, `pcpython`, dst).
- Tidak ada baris kode di toolkit ini yang men-set `http_proxy` / `https_proxy` / `all_proxy` secara global. Kalau variabel itu aktif, itu berasal dari luar toolkit ini — dan `tor-manager` akan memberitahumu kalau mendeteksinya.

Tujuannya: kamu bisa pakai Tor untuk menyembunyikan IP saat request ke API/layanan luar, tanpa risiko proses development lokal ikut diam-diam ke-proxy dan jadi lambat/error.

## Yang Termasuk

| File | Fungsi |
|---|---|
| `tor_manager.py` | UI utama: cek IP, leak test, service control, ganti negara, rotasi IP, circuit lock |
| `tor_aliases.sh` | Wrapper shell opt-in (`pcurl`, `pcpip`, `pcpython`, `torip`, `realip`, `leakcheck`) + setup/unsetup/uninstall |
| `install.sh` | Installer satu-baris |

## Instalasi

### Cara cepat (curl)

```bash
curl -fsSL https://raw.githubusercontent.com/Abiel122/Torra/main/install.sh | bash
```

### Cara manual (clone repo)

```bash
git clone https://github.com/Abiel122/Torra.git
cd Torra
bash install.sh
```

Installer akan:

1. Mengecek `python3`, `pip`, dan `curl` sudah tersedia.
2. Menyalin `tor_manager.py` dan `tor_aliases.sh` ke `~/.tor-manager/`.
3. Membuat command pendek `tor-manager` di `~/.local/bin/`.
4. Menambahkan satu blok `source` ke `.bashrc`/`.zshrc` kamu (ditandai komentar jelas, mudah dihapus manual kalau mau).

Installer **tidak** menginstall Tor atau proxychains secara otomatis — itu ditangani interaktif saat `tor-manager` dijalankan pertama kali, supaya kamu yang konfirmasi sebelum apa pun terpasang ke sistem.

Setelah selesai:

```bash
source ~/.bashrc   # atau ~/.zshrc
tor-manager
```

### Requirement

- Linux (Debian/Ubuntu/Arch) atau Termux di Android
- Python 3.8+
- Akses `sudo` untuk install/start Tor dan menulis config proxychains (kecuali sudah root)

## Menjalankan UI

```bash
tor-manager
```

Saat pertama kali jalan, ia mengecek apakah `tor` dan `proxychains4` sudah terinstall, dan menawarkan instalasi kalau belum. Lalu menu utama muncul:

```
1. Cek IP & Lokasi
2. IP Leak Test (real-time)
3. Rotasi IP (sekali)
4. Auto-Rotate IP
5. Ganti Exit Country
6. Service Control (Tor / Proxychains / Lock)
7. Cara Pakai Proxychains (opt-in guide)
8. Keluar
```

Menu **Service Control** punya sub-menu setup/unsetup/uninstall:

```
1. Start Tor
2. Stop Tor
3. Restart Tor
4. Setup Proxychains
5. Unsetup Proxychains (matikan config, simpan backup)
6. Uninstall Proxychains (hapus total)
7. Uninstall Tor (hapus total)
8. Toggle Circuit Lock (kunci/buka IP exit)
9. Kembali ke menu utama
```

## Wrapper Shell (opt-in per command)

Setelah `source ~/.bashrc`, fungsi-fungsi ini tersedia di terminal:

| Command | Fungsi |
|---|---|
| `pcurl <url>` | curl lewat Tor |
| `pcwget <url>` | wget lewat Tor |
| `pcpip install <pkg>` | pip install lewat Tor |
| `pcpython script.py` | jalankan python script lewat Tor |
| `pcnpm install -g <pkg>` | npm install lewat Tor (khusus kalau memang mau install package tertentu secara anonim) |
| `torip` | tampilkan IP saat ini via Tor |
| `realip` | tampilkan IP asli (native) |
| `leakcheck` | bandingkan IP asli vs IP Tor, deteksi leak |
| `pccheck_env` | cek apakah ada proxy global ke-set tanpa sengaja |
| `pcsetup` | tulis config proxychains |
| `pcunsetup` | nonaktifkan config proxychains (backup disimpan) |
| `pcuninstall` | uninstall proxychains total |
| `toruninstall` | uninstall Tor total |

Command biasa (`npm`, `pip`, `python3`, `curl` tanpa prefix `pc`) **tidak pernah** ikut lewat Tor.

## Soal IP Tor yang Berubah-ubah

Ini perilaku normal Tor, bukan bug: setiap kali Tor restart atau membentuk circuit baru, exit node yang dipilih bisa berbeda — meskipun exit country yang di-set sama. Kalau kamu mau IP exit lebih stabil dan tidak ganti-ganti sendiri, aktifkan **Circuit Lock** dari menu Service Control. Saat aktif, rotasi IP (manual maupun auto-rotate) akan minta konfirmasi dulu sebelum mengganti circuit.

Catatan jujur: circuit lock bukan jaminan IP sama 100% selamanya — Tor tetap bisa membentuk circuit baru sendiri kalau circuit lama timeout/expired. Tapi ini jauh lebih stabil dibanding restart/rotate berulang.

## Uninstall Total

Dari dalam UI: **Service Control → Uninstall Proxychains** dan **Uninstall Tor**.

Atau dari shell setelah `source` aliases:

```bash
pcuninstall
toruninstall
```

Untuk menghapus toolkit ini sendiri:

```bash
rm -rf ~/.tor-manager ~/.local/bin/tor-manager
# lalu hapus blok antara "# >>> tor-manager aliases >>>" dan
# "# <<< tor-manager aliases <<<" di ~/.bashrc atau ~/.zshrc
```

## Lisensi & Tujuan Penggunaan

Toolkit ini ditujukan untuk privasi pribadi yang sah — menyembunyikan IP saat melakukan request ke layanan/API eksternal. Bukan untuk membypass pembatasan layanan pihak ketiga (rate limit, ban, dll).
