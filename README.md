# Ruina Core — Z-Hiruira's

Landing page + AI endpoint untuk **Ruina**, conversational core milik
Z-Hiruira's. Statik (HTML/CSS/JS) + 2 serverless function, siap deploy ke
Vercel.

## Struktur

```
public/
  index.html       halaman utama (hero, about, capabilities, live chat, endpoint docs, developer, credits)
  styles.css        tema warna gradient indigo→violet→pink→cyan, dark mode
  script.js         boot sequence animasi, logic chat widget, efek bubble interaktif
  assets/
    logo-192.png, logo-512.png   logo "RZ" (dibuat sendiri, gradient monogram)
    favicon.ico, favicon-16/32/48.png, apple-touch-icon.png
    og-image.png                preview link (WhatsApp/Twitter/Discord embed)
    Ruina-Thumb.jpeg            visual karakter Ruina
    Developer-Photo.png         PLACEHOLDER foto developer — ganti dengan foto asli
api/
  ruina.js          POST — chat dengan Ruina (pakai Anthropic API)
  developer.js      GET  — profil developer (JSON)
vercel.json
package.json
```

## ⚠️ Soal API key — WAJIB dibaca

Kamu sempat menempel sebuah **Anthropic secret key langsung di chat**. Begitu
sebuah key terlihat di tempat manapun di luar environment variable kamu
sendiri (termasuk di chat ke AI assistant manapun), key itu harus dianggap
**bocor**:

1. Buka **console.anthropic.com → API Keys**, cabut (revoke) key yang kamu
   tempel itu sekarang.
2. Generate key baru.
3. Pasang key baru itu **hanya** di Vercel → Project Settings →
   Environment Variables → `ANTHROPIC_API_KEY`. Jangan ditulis di kode,
   jangan dikirim di chat manapun lagi.

Kode di `api/ruina.js` sudah dibuat membaca dari `process.env.ANTHROPIC_API_KEY`
— tidak ada key yang ditulis langsung di file manapun di proyek ini.

## Setup cepat

```bash
npm install -g vercel
vercel link
vercel env add ANTHROPIC_API_KEY     # paste key BARU (bukan yang bocor)
vercel dev                           # jalan di localhost
vercel --prod                        # deploy
```

## Yang sudah ditambahkan di redesign ini

- Tema warna baru: gradient indigo → violet → pink → cyan, dark background,
  font Outfit (display) + Inter (body) + JetBrains Mono (code).
- Logo "RZ" dibuat sendiri (lihat `assets/logo-512.png`), dipakai juga
  sebagai favicon & ikon.
- Meta tag Open Graph + Twitter Card supaya link punya preview & gambar
  saat di-share (pakai `assets/og-image.png`).
- Efek bubble warna-warni yang muncul saat klik/tap (meledak) dan saat
  drag/swipe (jejak) — lihat `initBubbleFx()` di `script.js`. Murni
  dekoratif, `pointer-events: none`, jadi tidak menghalangi klik tombol/link.
- Live chat widget (`#chat`) yang benar-benar memanggil `/api/ruina`,
  termasuk riwayat percakapan ringan supaya kontekstual.
- `/api/developer` — endpoint publik berisi profil developer (skill, role).
- Section Developer (foto placeholder + skill tags) dan section Credits
  (Allah SWT, Family, Merantika Devista, Wolep, Yardan, Kayz, Ghofar, dst).

## Belum dibuat: fitur jual nomor/nokos

Bagian "jual nokos / sell WhatsApp number all region" **tidak** dibuat di
proyek ini. Reseller nomor virtual dalam jumlah besar untuk bikin akun
WhatsApp itu jenis layanan yang lazim disalahgunakan untuk lolos verifikasi
akun massal, spam, dan penipuan — jadi ini di luar yang bisa dibantu dibangun.
Kalau tujuannya monetisasi situs, lebih aman dan tetap bisa menarik kalau
arahnya ke hal lain: jual akses premium ke Ruina, donasi/dukungan developer,
jasa custom bot, atau merchandise — tinggal bilang kalau mau salah satu
dari itu dibangunkan.

## TODO manual

- [ ] Ganti `assets/Developer-Photo.png` dengan foto asli developer.
- [ ] Cabut + ganti API key Anthropic yang sempat ke-share (lihat di atas).
- [ ] Isi link sosial media developer kalau mau ditambahkan ke section Developer.
- [ ] Sesuaikan domain di meta `og:url` kalau subdomain berubah.
