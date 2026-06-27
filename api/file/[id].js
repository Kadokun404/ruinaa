// api/file/[id].js
// Ambil file dari Telegram berdasarkan encoded file_id, lalu redirect ke file aslinya.
// Akses: GET /api/file/:id
//
// Env: TOKEN-TELE-STORAGE

const BOT_TOKEN = process.env["TOKEN-TELE-STORAGE"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { id } = req.query;
  if (!id) return res.status(400).json({ ok: false, error: "File ID wajib diisi." });
  if (!BOT_TOKEN) {
    return res.status(500).json({ ok: false, error: "Server belum dikonfigurasi (TOKEN-TELE-STORAGE belum diset)." });
  }

  try {
    // Decode base64url -> file_id Telegram asli.
    const fileId = Buffer.from(id, "base64url").toString();

    const pathRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const pathData = await pathRes.json();

    if (!pathData.ok) {
      return res.status(404).json({ ok: false, error: "File tidak ditemukan." });
    }

    const filePath = pathData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.redirect(302, fileUrl);
  } catch (err) {
    console.error("File fetch error:", err);
    return res.status(500).json({ ok: false, error: "Server error: " + err.message });
  }
}
