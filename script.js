// script.js
const baseUrl = "http://localhost:5500";
let socket;
let userId = "";

function register() {
  userId = document.getElementById("userId").value;
  const password = document.getElementById("password").value;

  fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password })
  })
    .then(res => {
      if (res.ok) alert("Registered. Now log in.");
      else alert("Register failed");
    });
}

function login() {
  userId = document.getElementById("userId").value;
  const password = document.getElementById("password").value;

  fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password })
  })
    .then(res => {
      if (res.ok) {
        document.getElementById("login-card").style.display = "none";
        document.getElementById("chat-card").style.display = "block";
        document.getElementById("me").innerText = userId;
        connectSocket();
        loadMessages();
      } else {
        alert("Login failed");
      }
    });
}

function connectSocket() {
  socket = io(baseUrl);
  socket.emit("join", userId);

  socket.on("message", ({ from, message }) => {
    const div = document.createElement("div");
    div.innerText = `From ${from}: ${message}`;
    document.getElementById("messages").appendChild(div);
  });
}

function sendMessage() {
  const to = document.getElementById("to").value;
  const message = document.getElementById("text").value;

  if (!to || !message) return;

  socket.emit("message", { from: userId, to, message });

  fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: userId, to, message })
  });

  const div = document.createElement("div");
  div.innerText = `To ${to}: ${message}`;
  document.getElementById("messages").appendChild(div);
  document.getElementById("text").value = "";
}

function loadMessages() {
  fetch(`${baseUrl}/messages/${userId}`)
    .then(res => res.json())
    .then(data => {
      data.forEach(msg => {
        const div = document.createElement("div");
        div.innerText = `${msg.sender_id} → ${msg.receiver_id}: ${msg.content}`;
        document.getElementById("messages").appendChild(div);
      });
    });
}
