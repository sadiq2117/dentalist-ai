const messagesDiv = document.getElementById("messages");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const floatingMic = document.getElementById("floatingMic");

let recorder;
let audioChunks = [];

// Auto-open widget when floating mic is tapped
floatingMic.onclick = () => {
  document.getElementById("chat-container").style.display = "flex";
  floatingMic.style.display = "none";
};

// Send text message
sendBtn.onclick = () => {
  sendMessage(input.value);
};

function sendMessage(text) {
  if (!text.trim()) return;

  appendMessage("user", text);

  fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  })
  .then(r => r.json())
  .then(res => {
    appendMessage("ai", res.reply);

    if (res.audio) {
      const audio = new Audio(res.audio);
      audio.play();
    }
  });

  input.value = "";
}

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = role;
  div.innerText = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Microphone + iPhone fix
micBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);

  audioChunks = [];

  recorder.ondataavailable = e => audioChunks.push(e.data);

  recorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    appendMessage("ai", data.reply);

    if (data.audio) {
      new Audio(data.audio).play();
    }
  };

  recorder.start();

  setTimeout(() => recorder.stop(), 3000);
};
