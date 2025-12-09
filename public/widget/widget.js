// Dentalist AI Floating Widget
(function () {
    let isOpen = false;

    // Create the floating mic button
    const button = document.createElement("div");
    button.id = "dentalist-mic-btn";
    button.innerHTML = "🎤";
    document.body.appendChild(button);

    // Create the chat window
    const chat = document.createElement("div");
    chat.id = "dentalist-chatbox";
    chat.innerHTML = `
        <div class="chat-header">
            <span>Dentalist AI Assistant</span>
            <button id="chat-close">×</button>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input">
            <input id="chat-text" type="text" placeholder="Ask anything…" />
            <button id="chat-send">➤</button>
        </div>
    `;
    document.body.appendChild(chat);

    // Elements
    const closeBtn = document.getElementById("chat-close");
    const sendBtn = document.getElementById("chat-send");
    const textInput = document.getElementById("chat-text");
    const messages = document.getElementById("chat-messages");

    function addMessage(text, sender) {
        const msg = document.createElement("div");
        msg.className = "msg " + sender;
        msg.innerText = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage() {
        const userText = textInput.value.trim();
        if (!userText) return;

        addMessage(userText, "user");
        textInput.value = "";

        // Send to your Vercel API
        const res = await fetch("https://dentalist-ai.vercel.app/api/dentalist-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userText })
        });

        const data = await res.json();
        addMessage(data.reply, "bot");
    }

    // Toggle chat window
    button.onclick = () => {
        isOpen = !isOpen;
        chat.style.display = isOpen ? "flex" : "none";
    };

    closeBtn.onclick = () => {
        isOpen = false;
        chat.style.display = "none";
    };

    sendBtn.onclick = sendMessage;
    textInput.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });
})();
