// api/developer.js
// Endpoint publik: info developer di balik Z-Hiruira's.
// Akses: GET /api/developer

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      author: "Z-Hiruira's",
      error: "method_not_allowed",
      message: "Gunakan GET untuk endpoint ini.",
    });
  }

  return res.status(200).json({
    ok: true,
    author: "Z-Hiruira's",
    result: {
      name: "Z-Hiruira's Developer",
      role: "Fullstack Developer · Bot & AI Integration",
      skills: [
        "JavaScript / Node.js",
        "Vercel Serverless Functions",
        "REST API Design",
        "WhatsApp Bot (Baileys)",
        "Prompt Engineering / AI Integration",
        "UI / Frontend Design",
        "Telegram Bot API",
      ],
      project: "Ruina Core",
      credits: [
        "Allah SWT",
        "Family",
        "Merantika Devista",
        "Wolep",
        "Yardan",
        "Kayz",
        "Ghofar",
      ],
    },
    meta: {
      status: "active",
      photo: "/assets/Developer-Photo.png",
      note: "Foto masih placeholder, tinggal diganti developer.",
    },
  });
}
