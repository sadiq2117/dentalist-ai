// public/widget/embed.js
// Dentalist AI floating widget (premium UI + voice + effects)

(function () {
  const API_BASE = "https://dentalist-ai.vercel.app";
  const STORAGE_KEY = "dentalist-ai-widget-state";
  const AUTO_OPEN_SESSION_KEY = "dentalist-ai-auto-opened";

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
            <div class="da-title-text">
              <span class="da-title-main">Dentalist AI</span>
              <span class="da-title-sub">
                <span class="da-status-dot"></span> Online · 24/7
              </span>
            </div>
          </div>
          <button class="da-close-btn" type="button" aria-label="Close chat">×</button>
        </div>

        <div class="da-chat-subtitle">
          I can help you book, reschedule, or answer questions about your visit.
        </div>

        <div class="da-messages"></div>

        <!-- Multi-layer voice waveform while recording -->
        <div class="da-wave-container da-wave-hidden">
          <div class="da-wave-ring"></div>
          <div class="da-wave-bars">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="da-wave-line"></div>
          <span class="da-wave-label">Listening...</span>
        </div>

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

    /* Floating button with orange glow */
    .da-floating-btn {
      width: 64px;
      height: 64px;
      border-radius: 999px;
      border: none;
      background: radial-gradient(circle at 30% 20%, #ffd4b8 0, #ff6a1a 40%, #b93815 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 22px rgba(255,106,26,0.8), 0 20px 50px rgba(0,0,0,0.55);
      cursor: pointer;
      position: relative;
      animation: da-pulse 2.2s infinite;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .da-floating-btn:hover {
      transform: scale(1.07);
      box-shadow: 0 0 30px rgba(255,106,26,1), 0 24px 60px rgba(0,0,0,0.7);
    }

    .da-floating-btn.da-recording {
      background: radial-gradient(circle at 30% 20%, #ffd1d1 0, #ff3b30 40%, #b81414 100%);
      animation: da-record 1.5s infinite;
    }

    .da-floating-mic {
      font-size: 26px;
      color: #fff;
    }

    @keyframes da-pulse {
      0%   { transform: scale(1); }
      70%  { transform: scale(1.03); }
      100% { transform: scale(1); }
    }

    @keyframes da-record {
      0% { box-shadow: 0 0 0 0 rgba(255,59,48,0.7); }
      70% { box-shadow: 0 0 0 18px rgba(255,59,48,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,59,48,0); }
    }

    /* Chat window with springy slide-in + frosted look */
    .da-chat {
      position: absolute;
      bottom: 90px;
      right: 0;
      width: min(380px, 92vw);
      height: 520px;
      background: rgba(5,8,20,0.9);
      backdrop-filter: blur(20px) saturate(150%);
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 24px 80px rgba(0,0,0,0.75);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      transform: translateY(32px) scale(0.9);
      opacity: 0;
      pointer-events: none;
      transition:
        opacity 0.26s cubic-bezier(0.18, 0.89, 0.32, 1.28),
        transform 0.26s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    }

    .da-chat--hidden {
      opacity: 0;
      transform: translateY(32px) scale(0.9);
      pointer-events: none;
    }

    .da-chat:not(.da-chat--hidden) {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .da-chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: linear-gradient(135deg, #020617 0%, #0b1220 50%, #020617 100%);
      border-bottom: 1px solid rgba(148,163,184,0.4);
    }

    .da-chat-header.da-speaking {
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
      background: radial-gradient(circle at top left, #1f2937 0%, #020617 60%);
    }

    .da-chat-title {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .da-title-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .da-title-main {
      font-weight: 600;
      font-size: 15px;
      color: #f9fafb;
    }

    .da-title-sub {
      font-size: 11px;
      color: #9ca3af;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .da-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #22c55e;
      box-shadow: 0 0 0 0 rgba(34,197,94,0.7);
      animation: da-online-pulse 1.8s infinite;
    }

    @keyframes da-online-pulse {
      0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.65); }
      70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }

    .da-logo-tooth {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: rgba(248,250,252,0.1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #e5e7eb;
    }

    .da-close-btn {
      border: none;
      background: transparent;
      color: #e5e7eb;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.75;
      padding: 2px 4px;
    }
    .da-close-btn:hover { opacity: 1; }

    .da-chat-subtitle {
      font-size: 12px;
      color: #9ca3af;
      padding: 6px 16px 8px 16px;
      background: rgba(15,23,42,0.8);
      border-bottom: 1px solid rgba(148,163,184,0.25);
    }

    .da-messages {
      flex: 1;
      padding: 12px 14px 10px 14px;
      overflow-y: auto;
      background: radial-gradient(circle at top left, #111827 0, #050814 60%);
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

    /* User bubble w/ orange glow */
    .da-msg-user {
      margin-left: auto;
      background: #ff6a1a;
      color: #fff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 0 18px rgba(255,106,26,0.9);
    }

    .da-msg-bot {
      margin-right: auto;
      background: rgba(15,23,42,0.92);
      color: #f9fafb;
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(148,163,184,0.5);
    }

    /* Typing wave bubble */
    .da-msg-loading {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }

    .da-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #e5e7eb;
      animation: da-bounce 1s infinite ease-in-out;
    }
    .da-dot:nth-child(2) { animation-delay: 0.15s; }
    .da-dot:nth-child(3) { animation-delay: 0.3s; }

    @keyframes da-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-5px); opacity: 1; }
    }

    /* Waveform container */
    .da-wave-container {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-top: 1px solid rgba(148,163,184,0.4);
      border-bottom: 1px solid rgba(148,163,184,0.3);
      background: rgba(15,23,42,0.8);
    }

    .da-wave-hidden {
      display: none;
    }

    .da-wave-ring {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      border: 2px solid rgba(255,255,255,0.4);
      position: relative;
      overflow: hidden;
    }

    .da-wave-ring::after {
      content: "";
      position: absolute;
      inset: 5px;
      border-radius: inherit;
      background: radial-gradient(circle, #ff6a1a 0, transparent 70%);
      opacity: 0.7;
      animation: da-wave-pulse 1.4s infinite;
    }

    @keyframes da-wave-pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      70% { transform: scale(1.1); opacity: 0.15; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    .da-wave-bars {
      display: flex;
      gap: 2px;
      align-items: flex-end;
      height: 18px;
    }

    .da-wave-bars span {
      width: 3px;
      border-radius: 999px;
      background: #fb923c;
      animation: da-wave-bars 0.9s infinite ease-in-out;
    }

    .da-wave-bars span:nth-child(2) { animation-delay: 0.12s; }
    .da-wave-bars span:nth-child(3) { animation-delay: 0.24s; }
    .da-wave-bars span:nth-child(4) { animation-delay: 0.36s; }
    .da-wave-bars span:nth-child(5) { animation-delay: 0.48s; }

    @keyframes da-wave-bars {
      0%, 100% { height: 4px; opacity: 0.4; }
      50% { height: 18px; opacity: 1; }
    }

    .da-wave-line {
      flex: 1;
      height: 14px;
      position: relative;
      overflow: hidden;
    }

    .da-wave-line::before {
      content: "";
      position: absolute;
      left: -40%;
      right: -40%;
      top: 50%;
      height: 2px;
      margin-top: -1px;
      background: linear-gradient(90deg, transparent, #f97316, transparent);
      animation: da-wave-line 1.5s infinite linear;
    }

    @keyframes da-wave-line {
      0% { transform: translateX(0); }
      100% { transform: translateX(40%); }
    }

    .da-wave-label {
      font-size: 11px;
      color: #e5e7eb;
      opacity: 0.9;
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
      background: rgba(248,250,252,0.1);
      color: #f9fafb;
      font-size: 15px;
      cursor: pointer;
      transition: transform 0.1s ease, background 0.1s ease;
    }

    .da-inline-mic.da-recording {
      background: #ff3b30;
      transform: scale(0.96);
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

    .da-input::placeholder {
      color: #6b7280;
    }

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
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }

    .da-send-btn:active {
      transform: translateY(1px) scale(0.97);
      box-shadow: 0 1px 2px rgba(0,0,0,0.5);
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
  const headerEl = root.querySelector(".da-chat-header");
  const openBtn = root.querySelector(".da-floating-btn");
  const closeBtn = root.querySelector(".da-close-btn");
  const messagesEl = root.querySelector(".da-messages");
  const inputEl = root.querySelector(".da-input");
  const sendBtn = root.querySelector(".da-send-btn");
  const inlineMicBtn = root.querySelector(".da-inline-mic");
  const waveContainer = root.querySelector(".da-wave-container");

  let isOpen = false;
  let sending = false;
  let conversationHistory = [];
  let hasInteracted = false;
  let hasSentWelcome = false;
  let isRecording = false;

  // Subtle typing sound (one file, random small variation by volume)
  const typingSoundUrl = "https://assets.mixkit.co/sfx/preview/mixkit-soft-click-1127.mp3";

  function playTypingSound() {
    try {
      const audio = new Audio(typingSoundUrl);
      audio.volume = 0.3 + Math.random() * 0.2;
      audio.play().catch(() => {});
    } catch {}
  }

  // ========= STATE =========
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
        history: conversationHistory.slice(-12),
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
      hasSentWelcome = state.history.some((m) => m.role === "assistant");
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
      maybeSendWelcome();
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

  function setRecording(flag) {
    isRecording = flag;
    openBtn.classList.toggle("da-recording", flag);
    inlineMicBtn.classList.toggle("da-recording", flag);
    waveContainer.classList.toggle("da-wave-hidden", !flag);
  }

  function setSpeaking(flag) {
    headerEl.classList.toggle("da-speaking", flag);
  }

  function getGreetingText() {
    const h = new Date().getHours();
    let prefix = "Hi";
    if (h >= 5 && h < 12) prefix = "Good morning";
    else if (h >= 12 && h < 18) prefix = "Good afternoon";
    else prefix = "Good evening";

    return `${prefix}! I’m Dentalist AI. I can help you book or reschedule an appointment, or answer questions about your visit. How can I help today?`;
  }

  function maybeSendWelcome() {
    if (hasSentWelcome) return;
    if (conversationHistory.length > 0) {
      hasSentWelcome = true;
      return;
    }
    const welcome = getGreetingText();
    appendMessage(welcome, "bot");
    hasSentWelcome = true;
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
      playTypingSound();

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

      setRecording(true);

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);

        const blob = new Blob(chunks, { type: "audio/webm" });
        await sendVoiceBlob(blob);
      };

      recorder.start();

      const stop = () => {
        if (recorder.state !== "inactive") recorder.stop();
        window.removeEventListener("mouseup", stop);
        window.removeEventListener("touchend", stop);
      };

      window.addEventListener("mouseup", stop);
      window.addEventListener("touchend", stop);
    } catch (err) {
      console.error("Mic permission error:", err);
      setRecording(false);
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
        playTypingSound();
        appendMessage(data.replyText, "bot");
      }

      if (data.audio) {
        setSpeaking(true);
        const audio = new Audio(data.audio);
        audio.play().catch((err) =>
          console.warn("Could not autoplay voice response:", err)
        );
        audio.onended = () => setSpeaking(false);
        audio.onpause = () => setSpeaking(false);
      }
    } catch (err) {
      console.error("Dentalist voice error:", err);
      loadingBubble.remove();
      appendMessage(
        "Sorry, I couldn’t process that voice message. Please try again.",
        "bot"
      );
      setSpeaking(false);
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

  // floating mic: if chat closed → open; if open → start voice
  openBtn.addEventListener("mousedown", () => {
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

  // global opener if you ever want to open from internal buttons
  window.openDentalistChat = () => {
    toggleChat(true);
    hasInteracted = true;
  };

  // ========= RESTORE & AUTO-OPEN =========
  restoreFromState();

  setTimeout(() => {
    const state = loadState();
    const alreadyAutoOpened = sessionStorage.getItem(AUTO_OPEN_SESSION_KEY);
    if (!hasInteracted && !(state && state.open) && !alreadyAutoOpened) {
      toggleChat(true);
      sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, "1");
    }
  }, 5000);
})();
