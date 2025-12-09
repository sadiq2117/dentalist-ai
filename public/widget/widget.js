const floatBtn = document.getElementById("dentalist-float-btn");
const chatBox = document.getElementById("dentalist-chatbox");
const messagesDiv = document.getElementById("chat-messages");
const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");

let isChatOpen = false;

/* ---------------- OPEN / CLOSE CHAT ---------------- */

floatBtn.addEventListener("click", () => {
  isChatOpen = !isChatOpen;
  chatBox.classList.toggle("hidden");
});

/* ---------------- SEND MESSAGE ---------------- */

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addUserMessage(text);
  input.value = "";

  fetchAIResponse(text);
}

/* ---------------- ADD MESSAGES ---------------- */

function addUserMessage(text) {
  const bubble = document.createElement("div");
  bubble.className = "user-msg";
  bubble.innerText = text;
  messagesDiv.appendChild(bubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addAIMessage(text) {
  const bubble = document.createElement("div");
  bubble.className = "ai-msg";
  bubble.innerText = text;
  messagesDiv.appendChild(bubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* ---------------- CALL BACKEND ---------------- */

async function fetchAIResponse(text) {
  const res = await fetch("https://dentalist-ai.vercel.app/api/dentalist-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();
  addAIMessage(data.reply);

  // play audio response
  if (data.audio) {
    const audio = new Audio("data:audio/mp3;base64," + data.audio);
    audio.play();
  }
}

/* ---------------- MICROPHONE ---------------- */

let recognition;

micBtn.onclick = () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice input not supported on this device");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    sendMessage();
  };

  recognition.start();
};
