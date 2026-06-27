# Ruina Core — Z-Hiruira's

Landing page + AI endpoint + cloud storage untuk ekosistem **Z-Hiruira's**.
Statik (HTML/CSS/JS, tanpa framework) + serverless functions, siap deploy ke
Vercel.

## Struktur proyek

```
api/
  ruina.js          POST  /api/ruina        — chat dengan Ruina (Anthropic API)
  developer.js      GET   /api/developer    — profil developer (JSON)
  upload.js         POST  /api/upload       — upload file ke Telegram
  file/
    [id].js         GET   /api/file/:id     — redirect ke file asli

public/
  index.html         halaman utama (hero, preview, navigasi ke semua section)
  ruina.html         live chat dengan Ruina + dokumentasi endpoint /api/ruina
  developer.html     profil developer, skill, link source code
  donasi.html        halaman dukungan/donasi
  cloud.html         upload & share file + dokumentasi endpoint /api/upload
  assets/
    logo-192.png, logo-512.png      ikon/logo "RZ"
    favicon.ico, favicon-16/32/48.png, apple-touch-icon.png
    og-image.png                    preview link saat dibagikan (WA/Twitter/Discord)
    Ruina-Thumb.jpeg                visual preview Ruina, dipakai di index.html
    Developer-Photo.png             foto developer (placeholder, tinggal diganti)

vercel.json
package.json
```

Setiap halaman berdiri sendiri (CSS inline per halaman, tanpa file `styles.css`
atau `script.js` terpisah) supaya tidak ada dependensi silang yang mudah putus
saat satu halaman diedit.

## Perbaikan & pembersihan di revisi ini

- **Bug utama diperbaiki**: `upload.js` dan `[id].js` sebelumnya nyasar di
  dalam folder `public/`, padahal Vercel hanya mendeteksi serverless function
  dari folder `/api`. Akibatnya tombol upload di `cloud.html` selalu gagal
  (memanggil `/api/upload` yang tidak pernah ada). Sekarang sudah dipindah
  ke `api/upload.js` dan `api/file/[id].js`.
- File yatim yang dihapus karena tidak dipakai halaman manapun:
  `public/script.js` dan `public/styles.css` (sisa dari versi lama, ~950
  baris kode mati).
- `package.json` ditambah `"type": "module"` agar sintaks `import`/`export`
  di semua file `/api` konsisten dijalankan sebagai ESM oleh Node.
- Semua halaman sekarang punya set favicon & meta Open Graph yang lengkap
  dan konsisten (sebelumnya hanya `favicon.ico` yang dipasang, sisa aset
  logo/OG-image sudah ada di folder tapi tidak pernah dipakai di `<head>`).
- Navigasi antar halaman dirapikan — semua halaman sekarang punya link ke
  halaman lain (Ruina AI, Developer, Cloud, Donasi), bukan cuma tombol
  "← Kembali".
- `cloud.html`: progress bar upload sekarang pakai progres asli dari
  `XMLHttpRequest` (bukan animasi pura-pura), dan link "Cloud" di navigasi
  diarahkan ke halaman lokal `./cloud.html` (sebelumnya hardcode ke domain
  eksternal).
- `index.html`: gambar preview Ruina sekarang pakai aset lokal
  `assets/Ruina-Thumb.jpeg` (sebelumnya memuat gambar dari domain pihak
  ketiga yang sewaktu-waktu bisa hilang/berubah).
- **Ditambahkan panel "Pakai lewat API" di `cloud.html`** — dokumentasi
  endpoint upload dengan contoh kode siap pakai: Node.js (`node-fetch` +
  `form-data`), cURL, fetch dari browser, dan contoh response JSON-nya.
  Lihat bagian *Contoh pakai endpoint upload* di bawah.

## Contoh pakai endpoint upload (Node.js)

```js
// npm install node-fetch form-data
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const form = new FormData();
form.append("file", fs.createReadStream("./foto.png"));

const res = await fetch("https://<domain-kamu>/api/upload", {
  method: "POST",
  body: form,
  headers: form.getHeaders(), // jangan set Content-Type manual
});

const data = await res.json();

if (!data.ok) throw new Error(data.error);

console.log("Link file:", data.url);
console.log("Ukuran:", data.size, "bytes");
```

Response sukses:

```json
{
  "ok": true,
  "filename": "foto.png",
  "size": 482311,
  "url": "https://<domain-kamu>/api/file/AgADBQA...",
  "fileId": "AgADBQA..."
}
```

Panel interaktif yang sama (plus contoh cURL dan fetch browser) juga bisa
dilihat langsung di halaman `/cloud.html`.

## Env var yang wajib diset di Vercel

| Nama | Dipakai di | Keterangan |
|---|---|---|
| `ANTHROPIC_API_KEY` | `api/ruina.js` | API key Claude (Anthropic) |
| `TOKEN-TELE-STORAGE` | `api/upload.js`, `api/file/[id].js` | Token bot Telegram dari [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | `api/upload.js` | ID chat/channel tujuan file dikirim |

> Nama env var `TOKEN-TELE-STORAGE` mengandung tanda hubung, jadi di kode
> diakses lewat `process.env['TOKEN-TELE-STORAGE']` (bukan dot notation).
> Boleh tetap dipakai, atau diganti ke nama yang lebih konvensional seperti
> `TELEGRAM_BOT_TOKEN` kalau mau — tinggal samakan juga di Vercel.

### ⚠️ Soal API key yang sempat ke-paste di chat

Kalau ada API key yang sempat ditempel langsung di chat (ke AI assistant
manapun) atau di tempat lain selain Environment Variables Vercel, anggap
key itu **bocor**:

1. Buka **console.anthropic.com → API Keys**, cabut (revoke) key itu.
2. Generate key baru.
3. Pasang key baru hanya di Vercel → Project Settings → Environment
   Variables. Jangan ditulis di kode atau dikirim di chat manapun lagi.

### Catatan limit upload di Vercel

Endpoint `/api/upload` membatasi file maksimal 20MB di levei kode. Tapi
Vercel sendiri punya limit ukuran body request untuk Serverless Function —
secara default jauh lebih kecil dari 20MB (tergantung plan). Kalau upload
file besar gagal terus padahal di bawah 20MB, cek limit plan Vercel kamu
dan sesuaikan `MAX_SIZE` di `api/upload.js` kalau perlu.

## Setup cepat

```bash
npm install -g vercel
vercel link
vercel env add ANTHROPIC_API_KEY        # API key Claude (Anthropic)
vercel env add TOKEN-TELE-STORAGE       # token bot Telegram
vercel env add TELEGRAM_CHAT_ID         # chat id tujuan upload
vercel dev                              # jalan di localhost
vercel --prod                           # deploy
```

## TODO manual

- [ ] Ganti `assets/Developer-Photo.png` dengan foto asli developer.
- [ ] Isi link sosial media developer kalau mau ditambahkan ke `developer.html`.
- [ ] Sesuaikan domain di contoh kode `cloud.html` & `ruina.html` (saat ini
      ditulis `ruina.z-hiruira.biz.id`) kalau domain final berbeda.
- [ ] Isi nomor DANA/GoPay/rekening BCA asli di `donasi.html` (saat ini masih
      placeholder teks).
