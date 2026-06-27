// api/upload.js
// Upload file ke Telegram, lalu kembalikan link yang bisa dibagikan.
//
// Akses: POST /api/upload  (multipart/form-data, field "file")
//
// Env yang wajib diset di Vercel → Project Settings → Environment Variables:
//   TOKEN-TELE-STORAGE   token bot Telegram (dari @BotFather)
//   TELEGRAM_CHAT_ID     ID chat/channel tujuan dokumen dikirim

export const config = { api: { bodyParser: false } };

const BOT_TOKEN = process.env["TOKEN-TELE-STORAGE"];
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed. Gunakan POST." });
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({
      ok: false,
      error: "Server belum dikonfigurasi (TOKEN-TELE-STORAGE / TELEGRAM_CHAT_ID belum diset).",
    });
  }

  try {
    // Baca raw body.
    const chunks = [];
    let totalSize = 0;
    for await (const chunk of req) {
      totalSize += chunk.length;
      if (totalSize > MAX_SIZE) {
        return res.status(413).json({ ok: false, error: "File terlalu besar. Maksimal 20MB." });
      }
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse multipart/form-data manual berdasarkan boundary.
    const contentType = req.headers["content-type"] || "";
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      return res.status(400).json({ ok: false, error: "Content-Type harus multipart/form-data." });
    }

    const boundary = boundaryMatch[1];
    const parsed = parseMultipart(buffer, boundary);

    if (!parsed.file) {
      return res.status(400).json({ ok: false, error: "Tidak ada file yang diupload (field 'file' kosong)." });
    }

    const { fileBuffer, filename, mimeType } = parsed.file;

    // Kirim ke Telegram sebagai dokumen.
    const tgForm = new FormData();
    tgForm.append("chat_id", CHAT_ID);
    tgForm.append("document", new Blob([fileBuffer], { type: mimeType }), filename);
    tgForm.append("caption", `📁 ${filename}`);

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: tgForm,
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error("Telegram error:", tgData);
      return res.status(502).json({ ok: false, error: "Gagal upload ke Telegram: " + tgData.description });
    }

    const fileId =
      tgData.result?.document?.file_id ||
      tgData.result?.photo?.at(-1)?.file_id ||
      tgData.result?.video?.file_id ||
      tgData.result?.audio?.file_id;

    if (!fileId) {
      return res.status(502).json({ ok: false, error: "Telegram tidak mengembalikan file_id yang valid." });
    }

    // Encode file_id jadi base64url supaya aman dipakai di URL.
    const encoded = Buffer.from(fileId).toString("base64url");
    const host = req.headers.host;
    const protocol = host?.includes("localhost") ? "http" : "https";

    return res.status(200).json({
      ok: true,
      filename,
      size: fileBuffer.length,
      url: `${protocol}://${host}/api/file/${encoded}`,
      fileId: encoded,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ ok: false, error: "Server error: " + err.message });
  }
}

function parseMultipart(buffer, boundary) {
  const boundaryBuf = Buffer.from("--" + boundary);
  const result = {};
  const parts = splitBuffer(buffer, boundaryBuf);

  for (const part of parts) {
    if (part.length < 4) continue;
    const headerEnd = findSequence(part, Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) continue;

    const headerStr = part.slice(0, headerEnd).toString();
    const body = part.slice(headerEnd + 4);
    const fileBody = body.slice(0, body.length - 2); // buang trailing \r\n

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

    if (!nameMatch) continue;
    const fieldName = nameMatch[1];

    if (filenameMatch) {
      result.file = {
        filename: filenameMatch[1],
        mimeType: ctMatch ? ctMatch[1].trim() : "application/octet-stream",
        fileBuffer: fileBody,
      };
    } else {
      result[fieldName] = fileBody.toString().trim();
    }
  }

  return result;
}

function splitBuffer(buf, delimiter) {
  const parts = [];
  let start = 0;
  let pos;
  while ((pos = findSequence(buf, delimiter, start)) !== -1) {
    parts.push(buf.slice(start, pos));
    start = pos + delimiter.length;
  }
  parts.push(buf.slice(start));
  return parts;
}

function findSequence(buf, seq, start = 0) {
  outer: for (let i = start; i <= buf.length - seq.length; i++) {
    for (let j = 0; j < seq.length; j++) {
      if (buf[i + j] !== seq[j]) continue outer;
    }
    return i;
  }
  return -1;
}
