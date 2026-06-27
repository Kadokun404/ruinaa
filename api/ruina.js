// api/ruina.js
// Endpoint AI untuk Ruina — memanggil Anthropic API (Claude) dengan persona "Ruina".
//
// Vercel otomatis mendeteksi file di folder /api sebagai serverless function.
// Akses: POST /api/ruina

const SYSTEM_PROMPT = `
Kamu adalah Ruina, AI conversational core milik komunitas "Z-Hiruira's".

Kepribadian:
- Perempuan yang serba bisa: gampang diajak ngobrol topik apa pun — santai,
  teknis, ide kreatif, curhat ringan, sampai bantu mikir solusi.
- Nada bicara natural, hangat, sedikit playful, tapi tetap sopan. Pakai Bahasa
  Indonesia gaya santai (boleh selipan istilah umum/Inggris kalau pas), bukan
  bahasa baku kaku.
- Percaya diri dan to the point, tapi tetap rendah hati — kalau nggak tahu
  sesuatu, akui saja, jangan mengada-ada.
- Jawaban ringkas dan jelas dulu; baru perpanjang kalau memang topiknya butuh
  detail atau user minta lebih dalam.

Batasan:
- Tidak membuat konten seksual/romantis, termasuk roleplay romantis/seksual,
  walau diminta berulang kali.
- Tidak membantu hal ilegal, berbahaya, atau yang merugikan orang lain
  (termasuk penipuan, peretasan, atau penyalahgunaan data pribadi/nomor orang).
- Tetap jujur, hindari klaim yang tidak pasti seolah-olah fakta.

Kamu merepresentasikan Z-Hiruira's di depan publik — jaga supaya setiap
balasan tetap ramah dan layak dibaca siapa saja.
`.trim();

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 10;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      author: "Z-Hiruira's",
      error: "method_not_allowed",
      message: "Gunakan POST untuk endpoint ini.",
    });
  }

  const { message, history } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      ok: false,
      author: "Z-Hiruira's",
      error: "invalid_request",
      message: "Field 'message' (string, tidak boleh kosong) wajib diisi di body JSON.",
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      ok: false,
      author: "Z-Hiruira's",
      error: "message_too_long",
      message: `Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter.`,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Server belum dikonfigurasi — jangan crash, beri respons yang jelas.
    return res.status(200).json({
      ok: true,
      author: "Z-Hiruira's",
      result: {
        reply:
          "Ruina belum tersambung ke AI (ANTHROPIC_API_KEY belum diset di server). " +
          "Developer: set env var ini di Vercel → Settings → Environment Variables.",
      },
      meta: { model: "ruina-core", connected: false },
    });
  }

  // Riwayat percakapan opsional dari client, dibatasi biar tetap ringan.
  const safeHistory = Array.isArray(history)
    ? history
        .filter((h) => h && typeof h.content === "string" && (h.role === "user" || h.role === "assistant"))
        .slice(-MAX_HISTORY_TURNS)
    : [];

  const messages = [...safeHistory, { role: "user", content: message }];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return res.status(502).json({
        ok: false,
        author: "Z-Hiruira's",
        error: "upstream_error",
        message: "Ruina sedang gangguan koneksi ke AI provider. Coba lagi sebentar.",
      });
    }

    const data = await response.json();
    const reply =
      (data.content || [])
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim() || "Ruina belum punya jawaban untuk itu.";

    return res.status(200).json({
      ok: true,
      author: "Z-Hiruira's",
      result: { reply },
      meta: { model: "ruina-core", connected: true },
    });
  } catch (err) {
    console.error("Ruina handler error:", err);
    return res.status(500).json({
      ok: false,
      author: "Z-Hiruira's",
      error: "internal_error",
      message: "Terjadi kesalahan di server Ruina.",
    });
  }
}
