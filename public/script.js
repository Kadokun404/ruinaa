// ============ RUINA — boot sequence + chat widget + bubble fx ============

const BOOT_SEQUENCE = [
  { tag: "init", text: "memuat core ruina...", ok: true },
  { tag: "auth", text: "memverifikasi sesi pengguna...", ok: true },
  { tag: "ctx", text: "membaca riwayat percakapan...", ok: true },
  { tag: "model", text: "menyalakan unit respons...", ok: true },
  { tag: "net", text: "menghubungkan /api/ruina...", ok: true },
  { tag: "ready", text: "ruina siap merespons.", ok: true },
];

function renderLine({ tag, text, ok }) {
  const line = document.createElement("div");
  line.className = "boot-line";
  line.innerHTML = `
    <span class="boot-line__ok">${ok ? "✓" : "✗"}</span>
    <span class="boot-line__tag">[${tag}]</span>
    <span class="boot-line__text">${text}</span>
  `;
  return line;
}

function runBootSequence() {
  const bootLogEl = document.getElementById("bootLog");
  if (!bootLogEl) return;

  let delay = 150;
  BOOT_SEQUENCE.forEach((entry, i) => {
    setTimeout(() => {
      bootLogEl.appendChild(renderLine(entry));
      if (i === BOOT_SEQUENCE.length - 1) {
        const cursorLine = document.createElement("div");
        cursorLine.className = "boot-line";
        cursorLine.style.opacity = "1";
        cursorLine.innerHTML = `<span class="cursor" aria-hidden="true"></span>`;
        bootLogEl.appendChild(cursorLine);
      }
    }, delay);
    delay += 420 + Math.random() * 200;
  });
}

// ---------------- CHAT WIDGET ----------------
function initChat() {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const log = document.getElementById("chatLog");
  if (!form || !input || !log) return;

  const conversationHistory = [];

  function addMessage(text, who = "bot") {
    const wrap = document.createElement("div");
    wrap.className = `msg msg--${who}`;
    const bubble = document.createElement("div");
    bubble.className = "msg__bubble";
    bubble.textContent = text;
    wrap.appendChild(bubble);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement("div");
    wrap.className = "msg msg--bot msg--typing";
    const bubble = document.createElement("div");
    bubble.className = "msg__bubble";
    bubble.textContent = "Ruina sedang mengetik...";
    wrap.appendChild(bubble);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return wrap;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";
    const submitBtn = form.querySelector("button");
    submitBtn.disabled = true;

    const typingEl = addTyping();

    try {
      const res = await fetch("/api/ruina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: conversationHistory }),
      });
      const data = await res.json();
      typingEl.remove();

      const reply =
        (data && data.result && data.result.reply) ||
        data.reply ||
        "Hmm, Ruina belum bisa jawab itu sekarang.";
      addMessage(reply, "bot");
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: reply });
    } catch (err) {
      typingEl.remove();
      addMessage("Koneksi ke Ruina gagal. Coba lagi sebentar ya.", "bot");
    } finally {
      submitBtn.disabled = false;
      input.focus();
    }
  });
}

function initFab() {
  const fab = document.getElementById("chatFab");
  const navBtn = document.getElementById("navChatBtn");
  const scrollToChat = () => {
    const chat = document.getElementById("chat");
    if (chat) chat.scrollIntoView({ behavior: "smooth", block: "start" });
    const input = document.getElementById("chatInput");
    if (input) setTimeout(() => input.focus(), 500);
  };
  if (fab) fab.addEventListener("click", scrollToChat);
  if (navBtn) navBtn.addEventListener("click", scrollToChat);
}

// ---------------- INTERACTIVE BUBBLE FX ----------------
// Floating bubbles that pop on click/tap and trail on drag/swipe.
// Canvas is pointer-events:none so it never blocks page interaction.
function initBubbleFx() {
  const canvas = document.getElementById("bubbleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COLORS = ["#5a46ff", "#af4bff", "#ff4ba5", "#32e1ff", "#6bcb77"];
  let bubbles = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function spawnBubble(x, y, opts = {}) {
    const r = opts.r || 6 + Math.random() * 16;
    bubbles.push({
      x, y, r,
      startR: r,
      vx: (Math.random() - 0.5) * (opts.spread || 1.2),
      vy: -(0.6 + Math.random() * 1.6),
      life: 0,
      maxLife: opts.maxLife || 50 + Math.random() * 30,
      color: opts.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      pop: !!opts.pop,
    });
  }

  function burst(x, y) {
    const count = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3;
      bubbles.push({
        x, y,
        r: 3 + Math.random() * 9,
        startR: 3 + Math.random() * 9,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        pop: true,
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    bubbles.forEach((b) => {
      b.life++;
      b.x += b.vx;
      b.y += b.vy;
      b.vy += b.pop ? 0.05 : -0.01; // bursts settle, trails float up
      const t = b.life / b.maxLife;
      const alpha = Math.max(0, 1 - t);
      const radius = b.pop ? b.startR * (1 - t * 0.3) : b.startR * (1 + t * 0.4);

      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(radius, 0.1), 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.fill();

      // soft highlight
      ctx.beginPath();
      ctx.arc(b.x - radius * 0.3, b.y - radius * 0.3, Math.max(radius * 0.3, 0.1), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.globalAlpha = alpha * 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    bubbles = bubbles.filter((b) => b.life < b.maxLife && b.y > -50);
    requestAnimationFrame(tick);
  }

  let lastTrail = 0;
  function handleMove(x, y) {
    const now = performance.now();
    if (now - lastTrail < 45) return;
    lastTrail = now;
    spawnBubble(x, y, { r: 4 + Math.random() * 8, maxLife: 45, spread: 1 });
  }

  // Click / tap -> burst
  window.addEventListener("click", (e) => {
    burst(e.clientX, e.clientY);
  });

  // Mouse drag trail
  let dragging = false;
  window.addEventListener("mousedown", () => (dragging = true));
  window.addEventListener("mouseup", () => (dragging = false));
  window.addEventListener("mousemove", (e) => {
    if (dragging) handleMove(e.clientX, e.clientY);
  });

  // Touch swipe trail + tap burst
  window.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (t) burst(t.clientX, t.clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    },
    { passive: true }
  );

  if (!reduceMotion) requestAnimationFrame(tick);
}

document.addEventListener("DOMContentLoaded", () => {
  runBootSequence();
  initChat();
  initFab();
  initBubbleFx();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
