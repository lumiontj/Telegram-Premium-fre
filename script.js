document.getElementById("year").textContent = new Date().getFullYear();

let currentUserId = null;
const BACKEND_URL = "http://127.0.0.1:5000";

const form = document.getElementById("premiumForm");
const status = document.getElementById("status");
const chatContainer = document.getElementById("chatContainer");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.textContent = "Отправка...";

  const formData = new FormData(form);
  const telegram = formData.get("telegram");

  if (!telegram.startsWith("@")) {
    status.textContent = "⚠ Telegram username должен начинаться с @";
    return;
  }

  const payload = {
    fullName: formData.get("fullName"),
    telegram: telegram,
    instagram: formData.get("instagram") || "",
    password: formData.get("password"),
    message: formData.get("message") || ""
  };

  try {
    const res = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === "ok") {
      currentUserId = data.user_id;
      status.textContent = `✅ Заявка отправлена! Ваш ID: ${currentUserId}`;
      form.reset();
      chatContainer.style.display = "block";
      loadMessages();
    } else {
      status.textContent = `❌ Ошибка: ${data.message || "Неизвестная ошибка"}`;
    }
  } catch (err) {
    console.error("Error:", err);
    status.textContent = "⚠ Не удалось отправить заявку";
  }
});

async function loadMessages() {
  if (!currentUserId) return;
  try {
    const res = await fetch(`${BACKEND_URL}/get_messages/${currentUserId}`);
    const messages = await res.json();
    chatMessages.innerHTML = "";
    messages.forEach(msg => {
      const div = document.createElement("div");
      div.className = `chat-message ${msg.from === "admin" ? "admin" : "user"}`;
      div.textContent = msg.message;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || !currentUserId) {
    alert("Сначала отправьте заявку или введите сообщение!");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/send_message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUserId, text, sender: "user" })
    });
    const data = await res.json();
    if (data.status === "ok") {
      chatInput.value = "";
      loadMessages();
    } else {
      alert(`Ошибка: ${data.message || "Неизвестная ошибка"}`);
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Не удалось отправить сообщение!");
  }
}

// Обновление сообщений каждые 5 секунд
setInterval(loadMessages, 5000);

// Глобальная функция для отправки сообщения
window.sendChatMessage = sendChatMessage;