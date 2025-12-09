// public/widget/embed.js
// Dentalist AI floating widget (enhanced UI)

(function () {
  const API_BASE = "https://dentalist-ai.vercel.app";
  const STORAGE_KEY = "dentalist-ai-widget-state";

  if (window.__dentalistWidgetLoaded) return;
  window.__dentalistWidgetLoaded = true;

  // ROOT
  const root = document.createElement("div");
  root.id = "dentalist-ai-widget-root";
  document.body.appendChild(root);

  root.innerHTML = `
    <div class="da-widget">
      <div class="da-chat da-chat--hidden">
        <div class="da-chat-header">
          <div class="da-chat-title">
            <span class="da-logo-tooth">🦷</span> Dentalist AI
          </div>
          <button class="da-close-btn" aria-label="Close">×</button>
        </div>

        <div class="da-chat-subtitle">
          I can help you book, reschedule, or ask questions about your visit.
        </div>

        <div class="da-messages"></div>

        <div class="da-input-row">
          <button class="da-inline-mic">🎤</button>
          <input class="da-input" placeholder="Ask about booking, rescheduling, or treatment..." />
          <button class="da-send-btn">➤</button>
        </div>

        <div class="da-voice-hint">
          Hold the orange mic or tap the inline mic to speak. I can also talk back to you.
        </div>
      </div>

      <button class="da-floating-btn">
        <span class="da-floating-mic">🎤</span>
      </button>
    </div>
  `;

  // STYLES
  const style = document.createElement("style");
  style.textContent = `

    /* ROOT */
    #dentalist-ai-widget-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 999999;
      font-family: "Inter", system-ui, sans-serif;
    }

    /* WRAPPER */
    .da-widget {
      position: absolute;
      bottom: 20px;
      right: 20px;
      pointer-events: auto;
    }

    /* FLOATING BUTTON WITH ORANGE GLOW */
    .da-floating-btn {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      background: radial-gradient(circle at 30% 20%, #ffd4b8 0, #ff6a1a 40%, #b93815 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 22px rgba(255,106,26,0.7), 0 22px 50px rgba(0,0,0,0.45);
      animation: da-pulse 2.2s infinite;
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .da-floating-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 0 32px rgba(255,106,26,1);
    }

    @keyframes da-pulse {
      0% { transform: scale(1); }
      70% { transform: scale(1.04); }
      100% { transform: scale(1); }
    }

    .da-floating-mic { font-size: 26px; color: #fff; }

    /* CHAT WINDOW WITH SLIDE-IN ANIMATION */
    .da-chat {
      width: min(380px, 92vw);
      height: 520px;
      background: rgba(5,8,20,0.92);
      backdrop-filter: blur(18px);
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.7);
      position: absolute;
      bottom: 90px;
      right: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(40px) scale(0.94);
      opacity: 0;
      transition: transform .3s ease, opacity .3s ease;
      pointer-events: none;
    }

    .da-chat--hidden {
      opacity: 0 !important;
      transform: translateY(40px) scale(0.94) !important;
      pointer-events: none;
    }

    .da-chat:not(.da-chat--hidden) {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    .da-chat-header {
      background:#0b1220;
      padding: 14px 16px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      border-bottom: 1px solid rgba(148,163,184,0.3);
    }

    .da-chat-title { font-weight: 600; color:#fff; display:flex; gap:8px; }

    .da-close-btn {
      background:none;
      border:none;
      color:#eee;
      font-size: 20px;
      cursor:pointer;
    }

    .da-chat-subtitle {
      color:#9ca3af;
      font-size: 12px;
      padding: 6px 16px;
      background:#0b1220;
    }

    .da-messages {
      flex:1;
      padding: 14px;
      overflow-y:auto;
      background: radial-gradient(circle at top left, #111827 0, #050814 60%);
    }

    /* USER BUBBLE WITH ORANGE GLOW */
    .da-msg-user {
      background:#ff6a1a;
      color:white;
      padding: 9px 12px;
      border-radius:12px;
      max-width: 80%;
      margin-left:auto;
      margin-bottom:8px;
      box-shadow: 0 0 14px rgba(255,106,26,0.7);
    }

    /* BOT BUBBLE */
    .da-msg-bot {
      background: rgba(15,23,42,0.9);
      border:1px solid rgba(148,163,184,0.3);
      color:#fff;
      padding: 9px 12px;
      border-radius:12px;
      max-width: 80%;
      margin-bottom:8px;
    }

    /* TYPING ANIMATION */
    .da-msg-loading {
      display:flex;
      gap:4px;
      padding:6px 12px;
    }
    .da-dot {
      width:6px;height:6px;
      background:#e5e7eb;
      border-radius:50%;
      animation: da-bounce 1s infinite ease-in-out;
    }
    .da-dot:nth-child(2){ animation-delay:0.15s; }
    .da-dot:nth-child(3){ animation-delay:0.3s; }

    @keyframes da-bounce {
      0%,80%,100% { transform: translateY(0); opacity:.4; }
      40% { transform: translateY(-5px); opacity:1; }
    }

    /* INPUT AREA */
    .da-input-row {
      padding:10px;
      display:flex;
      gap:6px;
      background:#0b1220;
      border-top:1px solid rgba(148,163,184,0.3);
    }

    .da-inline-mic {
      width:32px;height:32px;
      border-radius:50%;
      background:rgba(255,255,255,0.07);
      border:none;
      color:white;
      cursor:pointer;
    }

    .da-input {
      flex:1;
      padding:8px 12px;
      border-radius:20px;
      border:1px solid rgba(148,163,184,0.4);
      background:rgba(15,23,42,0.85);
      color:white;
    }

    .da-send-btn {
      width:36px;height:32px;
      border-radius:20px;
      background:#ff6a1a;
      border:none;
      color:white;
      cursor:pointer;
    }

  `;
  document.head.appendChild(style);

  // ELEMENTS
  const chatEl = root.querySelector(".da-chat");
  const openBtn = root.querySelector(".da-floating-btn");
  const closeBtn = root.querySelector(".da-close-btn");
  const messagesEl = root.querySelector(".da-messages");
  const inputEl = root.querySelector(".da-input");
  const sendBtn = root.querySelector(".da-send-btn");
  const micBtn = root.querySelector(".da-inline-mic");

  let conversationHistory = [];
  let sending = false;
  let isOpen = false;
  let hasInteracted = false;

  // 🔊 TYPING SOUND
  const typingSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-soft-click-1127.mp3");

  // Save + Restore
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      open: isOpen,
      history: conversationHistory.slice(-12),
    }));
  }

  function restoreFromState() {
    const state = loadState();
    if (!state) return;
    conversationHistory = state.history || [];
    conversationHistory.forEach(msg =>
      appendMessage(msg.content, msg.role === "user" ? "user" : "bot", false)
    );
    if (state.open) toggleChat(true);
  }

  // UI
  function toggleChat(forceOpen) {
    isOpen = forceOpen ?? !isOpen;
    chatEl.classList.toggle("da-chat--hidden", !isOpen);
    if (isOpen) inputEl.focus();
    saveState();
  }

  function appendMessage(text, from, saveHist = true) {
    const msg = document.createElement("div");
    msg.className = from === "user" ? "da-msg-user" : "da-msg-bot";
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    if (saveHist) {
      conversationHistory.push({
        role: from === "user" ? "user" : "assistant",
        content: text,
      });
      saveState();
    }
  }

  function appendTypingBubble() {
    const msg = document.createElement("div");
    msg.className = "da-msg-bot";
    msg.innerHTML = `
      <div class="da-msg-loading">
        <div class="da-dot"></div>
        <div class="da-dot"></div>
        <div class="da-dot"></div>
      </div>
    `;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  // TEXT SENDING
  async function sendText() {
    if (sending) return;
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = "";
    appendMessage(text, "user");
    typingSound.play().catch(() => {});

    const loader = appendTypingBubble();
    sending = true;

    try {
      const res = await fetch(`${API_BASE}/api/dentalist-chat`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          message: text,
          history: conversationHistory,
        }),
      });

      const data = await res.json();
      loader.remove();

      appendMessage(data.reply || "Something went wrong.", "bot");
    } catch (err) {
      loader.remove();
      appendMessage("Oops! Please try again.", "bot");
    }

    sending = false;
  }

  sendBtn.addEventListener("click", sendText);
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter") sendText();
  });

  // BUTTONS
  openBtn.addEventListener("click", () => toggleChat(true));
  closeBtn.addEventListener("click", () => toggleChat(false));

  restoreFromState();

  // Auto-open after 5s
  setTimeout(() => {
    if (!hasInteracted) toggleChat(true);
  }, 5000);

})();
