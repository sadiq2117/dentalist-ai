// public/widget/embed.js

(function () {
  // ==============================
  //  CONFIG
  // ==============================
  const API_BASE = "https://dentalist-ai.vercel.app"; // e.g. https://dentalist-ai.vercel.app
  const COLOR_PRIMARY = "#ff6a2a"; // Dentalist orange
  const COLOR_BG = "#050814";      // deep navy background for chat
  const COLOR_CARD = "#0b1220";
  const COLOR_TEXT = "#f9fafb";

  // Prevent double injection
  if (window.__dentalistWidgetLoaded) return;
  window.__dentalistWidgetLoaded = true;

  // ==============================
  //  CREATE DOM
  // ==============================
  const root = document.createElement("div");
  root.id = "dentalist-ai-widget-root";
  document.body.appendChild(root);

  root.innerHTML = `
    <div class="da-widget">

      <div class="da-chat ${"da-chat--hidden"}">
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
          <button class="da-inline-mic" type="button" aria-label="Voice message">
            🎤
          </button>
          <input
            class="da-input"
            type="text"
            placeholder="Ask about booking, rescheduling, or treatment..."
          />
          <button class="da-send-btn" type="button" aria-label="Send message">
            ➤
          </button>
        </div>

        <div class="da-voice-hint">
          Hold the orange mic or tap the inline mic to speak.
        </div>
      </div>

      <button class="da-floating-btn" type="button" aria-label="Open Dentalist AI">
        <span class="da-floating-mic">🎤</span>
      </button>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #dentalist-ai-widget-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 999999;
    }

    .da-widget {
      position: absolute;
      bottom: 20px;
      right: 20px;
      pointer-events: auto;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
        "Inter", sans-serif;
    }

    .da-floating-btn {
      width: 64px;
      height: 64px;
      border-radius: 999px;
      border: none;
      background: ${COLOR_PRIMARY};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 30px rgba(0,0,0,0.4);
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      position: relative;
    }

    .da-floating-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 40px rgba(0,0,0,0.55);
    }

    .da-floating-mic {
      font-size: 26px;
    }

    .da-chat {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: min(380px, 92vw);
      height: 520px;
      background: ${COLOR_BG};
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.65);
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
      transform: scale(0.9);
      pointer-events: none;
    }

    .da-chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 10px 16px;
      background: ${COLOR_CARD};
      border-bottom: 1px solid rgba(148,163,184,0.4);
    }

    .da-chat-title {
      font-weight: 600;
      font-size: 15px;
      color: ${COLOR_TEXT};
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .da-logo-tooth {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: rgba(248,250,252,0.12);
      font-size: 15px;
    }

    .da-close-btn {
      border: none;
      background: transparent;
      color: ${COLOR_TEXT};
      font-size: 20px;
      cursor: pointer;
      opacity: 0.75;
      padding: 0 4px;
    }

    .da-close-btn:hover {
      opacity: 1;
    }

    .da-chat-subtitle {
      font-size: 12px;
      color: #9ca3af;
      padding: 6px 16px 6px 16px;
      background: ${COLOR_CARD};
    }

    .da-messages {
      flex: 1;
      padding: 12px 14px 10px 14px;
      overflow-y: auto;
      background: radial-gradient(circle at top left, #111827 0, ${COLOR_BG} 55%);
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
      background: ${COLOR_PRIMARY};
      color: white;
      border-bottom-right-radius: 4px;
    }

    .da-msg-bot {
      margin-right: auto;
      background: rgba(15,23,42,0.9);
      color: ${COLOR_TEXT};
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(148,163,184,0.35);
    }

    .da-msg-loading {
      display: inline-flex;
      gap: 3px;
    }

    .da-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
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
      background: ${COLOR_CARD};
      gap: 6px;
    }

    .da-inline-mic {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: none;
      background: rgba(248,250,252,0.08);
      color: ${COLOR_TEXT};
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
      color: ${COLOR_TEXT};
      outline: none;
    }

    .da-input::placeholder {
      color: #6b7280;
    }

    .da-send-btn {
      border-radius: 999px;
      border: none;
      background: ${COLOR_PRIMARY};
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
      background: ${COLOR_CARD};
    }

    @media (max-width: 640px) {
      .da-chat {
        width: min(100vw - 20px, 440px);
        height: min(70vh, 560px);
        right: 10px;
        bottom: 90px;
      }

      .da-floating-btn {
        width: 58px;
        height: 58px;
      }
    }
  `;
  document.head.appendChild(style);

  // ==============================
  //  WIDGET LOGIC
  // ==============================
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

  function toggleChat(forceOpen) {
    isOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
    chatEl.classList.toggle("da-chat--hidden", !isOpen);
    if (isOpen) {
      inputEl.focus();
    }
  }

  openBtn.addEventListener("click", () => toggleChat(true));
  closeBtn.addEventListener("click", () => toggleChat(false));

  function appendMessage(text, from) {
    const msg = document.createElement("div");
    msg.className = "da-msg " + (from === "user" ? "da-msg-user" : "da-msg-bot");
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendLoadingBubble() {
    const msg = document.createElement("div");
    msg.className = "da-msg da-msg-bot";
    msg.innerHTML = `<span class="da-msg-loading">
      <span class="da-dot"></span><span class="da-dot"></span><span class="da-dot"></span>
    </span>`;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  async function sendTextMessage() {
    if (sending) return;
    const text = (inputEl.value || "").trim();
    if (!text) return;

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

      const reply = data.reply || "Sorry, I had trouble responding just now.";
      appendMessage(reply, "bot");

      // keep history so AI remembers context
      conversationHistory.push({ role: "user", content: text });
      conversationHistory.push({ role: "assistant", content: reply });
    } catch (err) {
      console.error("Chat send error:", err);
      loadingBubble.remove();
      appendMessage("Sorry, something went wrong. Please try again.", "bot");
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

  // ==============================
  //  VOICE HANDLING
  // ==============================
  async function recordAndSend() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser doesn't support microphone recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());

        await sendVoiceBlob(blob);
      };

      // Quick UX: hold to record; release to send
      // For now, simple click-to-start, click again to stop
      recorder.start();

      const stopRecording = () => {
        if (recorder.state !== "inactive") recorder.stop();
        window.removeEventListener("mouseup", stopRecording);
        window.removeEventListener("touchend", stopRecording);
      };

      window.addEventListener("mouseup", stopRecording);
      window.addEventListener("touchend", stopRecording);
    } catch (err) {
      console.error("Mic permission error:", err);
      alert("I couldn't access your microphone. Please check your browser settings.");
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
        conversationHistory.push({ role: "user", content: data.userText });
      }

      if (data.replyText) {
        appendMessage(data.replyText, "bot");
        conversationHistory.push({
          role: "assistant",
          content: data.replyText,
        });
      }

      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.play().catch((err) =>
          console.warn("Could not autoplay voice response:", err)
        );
      }
    } catch (err) {
      console.error("Voice send error:", err);
      loadingBubble.remove();
      appendMessage("Sorry, I couldn’t process that voice message.", "bot");
    } finally {
      sending = false;
    }
  }

  openBtn.addEventListener("mousedown", recordAndSend);
  openBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    recordAndSend();
  });
  inlineMicBtn.addEventListener("click", recordAndSend);
})();
