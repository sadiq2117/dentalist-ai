// public/widget/embed.js
// Dentalist AI floating widget (text + voice, mobile optimized)

(function () {
  // ========= CONFIG =========
  const API_BASE = "https://dentalist-ai.vercel.app"; // your Vercel backend
  const STORAGE_KEY = "dentalist-ai-widget-state";

  if (window.__dentalistWidgetLoaded) return;
  window.__dentalistWidgetLoaded = true;

  // ========= DOM SHELL =========
  const root = document.createElement("div");
  root.id = "dentalist-ai-widget-root";
  document.body.appendChild(root);

  root.innerHTML = `
    <div class="da-widget">
      <div class="da-chat da-chat--hidden">
        <div class="da-chat-header">
          <div class="da-chat-title">
            <span class="da-logo-tooth">🦷</span>
            Dentalist AI
          </div>
          <button class="da-close-btn" type="button" aria-label="Close chat">×</button>
        </div>

        <div class="da-chat-subtitle">
          I can help you book, reschedule, or ask questions about your visit.
        </div>

        <div class="da-messages"></div>

        <div class="da-input-row">
          <button class="da-inline-mic" type="button" aria-label="Voice message">🎤</button>
          <input class="da-input" type="text"
            placeholder="Ask about booking, rescheduling, or treatment..." />
          <button class="da-send-btn" type="button" aria-label="Send message">➤</button>
        </div>

        <div class="da-voice-hint">
          Hold the orange mic or tap the inline mic to speak. I can also talk back to you.
        </div>
      </div>

      <button class="da-floating-btn" type="button" aria-label="Open Dentalist AI">
        <span class="da-floating-mic">🎤</span>
      </button>
    </div>
  `;

  // ========= STYLES =========
  const style = document.createElement("style");
  style.textContent = `
    #dentalist-ai-widget-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 999999;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
    }

    .da-widget {
      position: absolute;
      bottom: 20px;
      right: 20px;
      pointer-events: auto;
    }

    /* Floating button */
    .da-floating-btn {
      width: 64px;
      height: 64px;
      border-radius: 999px;
      border: none;
      background: radial-gradient(circle at 30% 20%, #ffd4b8 0, #ff6a1a 40%, #b93815 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 18px 40px rgba(0,0,0,0.55);
      cursor: pointer;
      position: relative;
      animation: da-pulse 2.2s infinite;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .da-floating-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 22px 50px rgba(0,0,0,0.65);
    }

    .da-floating-mic {
      font-size: 26px;
      color: #fff;
    }

    @keyframes da-pulse {
      0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,106,26,0.55); }
      70%  { transform: scale(1.04); box-shadow: 0 0 0 12px rgba(255,106,26,0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,106,26,0); }
    }

    /* Chat window */
    .da-chat {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: min(380px, 92vw);
      height: 520px;
      background: #050814;
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      transform: scale(1);
      opacity: 1;
      transition: opacity 0.18s ease, transform 0.18s ease;
    }

    .da-chat--hidden {
      opacity: 0;
      transform: scale(0.92);
      pointer-events: none;
    }

    .da-chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 10px 16px;
      background: #0b1220;
      border-bottom: 1px solid rgba(148,163,184,0.45);
    }

    .da-chat-title {
      font-weight: 600;
      font-size: 15px;
      color: #f9fafb;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .da-logo-tooth {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: rgba(248,250,252,0.08);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }

    .da-close-btn {
      border: none;
      background: transparent;
      color: #e5e7eb;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.75;
      padding: 0 4px;
    }
    .da-close-btn:hover { opacity: 1; }

    .da-chat-subtitle {
      font-size: 12px;
      color: #9ca3af;
      padding: 6px 16px 8px 16px;
      background: #0b1220;
    }

    .da-messages {
      flex: 1;
      padding: 12px 14px 10px 14px;
      overflow-y: auto;
      background: radial-gradient(circle at top left, #111827 0, #050814 55%);
    }

    .da-msg {
      max-width: 85%;
      padding: 9px 11px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.35;
      margin-bottom: 8px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .da-msg-user {
      margin-left: auto;
      background: #ff6a1a;
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .da-msg-bot {
      margin-right: auto;
      background: rgba(15,23,42,0.9);
      color: #f9fafb;
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(148,163,184,0.45);
    }

    .da-msg-loading {
      display: inline-flex;
      gap: 3px;
    }

    .da-dot {
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: #e5e7eb;
      animation: da-bounce 1s infinite ease-in-out;
    }
    .da-dot:nth-child(2) { animation-delay: 0.16s; }
    .da-dot:nth-child(3) { animation-delay: 0.32s; }

    @keyframes da-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-4px); opacity: 1; }
    }

    .da-input-row {
      display: flex;
      align-items: center;
      padding: 8px 8px 10px 8px;
      border-top: 1px solid rgba(148,163,184,0.4);
      background: #0b1220;
      gap: 6px;
    }

    .da-inline-mic {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: none;
      background: rgba(248,250,252,0.08);
      color: #f9fafb;
      font-size: 15px;
      cursor: pointer;
    }

    .da-input {
      flex: 1;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.7);
      background: rgba(15,23,42,0.85);
      padding: 8px 12px;
      font-size: 13px;
      color: #f9fafb;
      outline: none;
    }

    .da-input::placeholder { color: #6b7280; }

    .da-send-btn {
      border-radius: 999px;
      border: none;
      background: #ff6a1a;
      color: white;
      width: 36px;
      height: 32px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .da-voice-hint {
      font-size: 11px;
      color: #9ca3af;
      padding: 0 16px 10px 16px;
      background: #0b1220;
    }

    @media (max-width: 640px) {
      .da-chat {
        width: min(100vw - 16px, 420px);
        height: min(70vh, 560px);
        right: 4px;
        bottom: 90px;
        border-radius: 18px;
      }

      .da-floating-btn {
        width: 54px;
        height: 54px;
      }
    }
  `;
  document.head.appendChild(style);

  // ========= ELEMENTS =========
  const chatEl = root.querySelector(".da-chat");
  const openBtn = root.querySelector(".da-floating-btn");
  const closeBtn = root.querySelector(".da-close-btn");
  const messagesEl = root.querySelector(".da-messages");
  const inputEl = root.querySelector(".da-input");
  const sendBtn = root.querySelector(".da-send-btn");
  const inlineMicBtn = root.querySelector(".da-inline-mic");

  let isOpen = false;
  let sending = false;
  let conversationHistory = [];
  let hasInteracted = false;

  // ========= STATE PERSISTENCE =========
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveState() {
    try {
      const state = {
        open: isOpen,
        history: conversationHistory.slice(-12), // last 12 turns
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function restoreFromState() {
    const state = loadState();
    if (!state) return;
    if (Array.isArray(state.history)) {
      conversationHistory = state.history;
      state.history.forEach((m) => {
        appendMessage(m.content, m.role === "user" ? "user" : "bot", false);
      });
    }
    if (state.open) {
      toggleChat(true, false);
    }
  }

  // ========= UI HELPERS =========
  function toggleChat(forceOpen, save = true) {
    isOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
    chatEl.classList.toggle("da-chat--hidden", !isOpen);
    if (isOpen) {
      inputEl.focus();
    }
    if (save) saveState();
  }

  function appendMessage(text, from, updateHistory = true) {
    const msg = document.createElement("div");
    msg.className =
      "da-msg " + (from === "user" ? "da-msg-user" : "da-msg-bot");
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    if (updateHistory) {
      conversationHistory.push({
        role: from === "user" ? "user" : "assistant",
        content: text,
      });
      saveState();
    }
  }

  function appendLoadingBubble() {
    const msg = document.createElement("div");
    msg.className = "da-msg da-msg-bot";
    msg.innerHTML = `
      <span class="da-msg-loading">
        <span class="da-dot"></span><span class="da-dot"></span><span class="da-dot"></span>
      </span>
    `;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  // ========= TEXT CHAT =========
  async function sendTextMessage() {
    if (sending) return;
    const text = (inputEl.value || "").trim();
    if (!text) return;

    hasInteracted = true;
    appendMessage(text, "user");
    inputEl.value = "";
    sending = true;

    const loadingBubble = appendLoadingBubble();

    try {
      const res = await fetch(`${API_BASE}/api/dentalist-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: conversationHistory,
        }),
      });

      const data = await res.json();

      loadingBubble.remove();

      const reply =
        data.reply ||
        "I’m here to help with your visit. Could you please try again?";
      appendMessage(reply, "bot");
    } catch (err) {
      console.error("Dentalist chat error:", err);
      loadingBubble.remove();
      appendMessage(
        "Sorry, something went wrong talking to Dentalist AI. Please try again in a moment.",
        "bot"
      );
    } finally {
      sending = false;
    }
  }

  sendBtn.addEventListener("click", sendTextMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  });

  // ========= VOICE (IN + OUT) =========
  async function recordAndSendVoice() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser doesn't support microphone recording.");
      return;
    }

    hasInteracted = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunks, { type: "audio/webm" });
        await sendVoiceBlob(blob);
      };

      recorder.start();

      // stop on mouseup / touchend (press-to-record)
      const stop = () => {
        if (recorder.state !== "inactive") recorder.stop();
        window.removeEventListener("mouseup", stop);
        window.removeEventListener("touchend", stop);
      };

      window.addEventListener("mouseup", stop);
      window.addEventListener("touchend", stop);
    } catch (err) {
      console.error("Mic permission error:", err);
      alert(
        "I couldn't access your microphone. Please allow mic access in your browser settings."
      );
    }
  }

  async function sendVoiceBlob(blob) {
    if (sending) return;
    sending = true;

    const loadingBubble = appendLoadingBubble();

    const formData = new FormData();
    formData.append("audio", blob, "voice.webm");

    try {
      const res = await fetch(`${API_BASE}/api/transcribe`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      loadingBubble.remove();

      if (data.userText) {
        appendMessage(data.userText, "user");
      }

      if (data.replyText) {
        appendMessage(data.replyText, "bot");
      }

      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.play().catch((err) =>
          console.warn("Could not autoplay voice response:", err)
        );
      }
    } catch (err) {
      console.error("Dentalist voice error:", err);
      loadingBubble.remove();
      appendMessage(
        "Sorry, I couldn’t process that voice message. Please try again.",
        "bot"
      );
    } finally {
      sending = false;
    }
  }

  // ========= EVENT HOOKS =========
  openBtn.addEventListener("click", () => {
    hasInteracted = true;
    toggleChat(true);
  });

  closeBtn.addEventListener("click", () => {
    toggleChat(false);
  });

  // floating mic press-to-record
  openBtn.addEventListener("mousedown", (e) => {
    // if chat is closed, first open; second press is voice
    if (!isOpen) {
      toggleChat(true);
      hasInteracted = true;
    } else {
      recordAndSendVoice();
    }
  });

  openBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!isOpen) {
      toggleChat(true);
      hasInteracted = true;
    } else {
      recordAndSendVoice();
    }
  });

  inlineMicBtn.addEventListener("click", () => {
    recordAndSendVoice();
  });

  // expose global opener for internal buttons if needed
  window.openDentalistChat = () => {
    toggleChat(true);
    hasInteracted = true;
  };

  // ========= RESTORE & AUTO-OPEN =========
  restoreFromState();

  // auto open after 5s if user hasn't interacted and chat not already open
  setTimeout(() => {
    const state = loadState();
    if (!hasInteracted && !(state && state.open)) {
      toggleChat(true);
    }
  }, 5000);
})();
