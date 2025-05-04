const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./db");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

const PORT = 5500;

const activeUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    activeUsers.set(userId, socket.id);
  });

  socket.on("message", ({ from, to, message }) => {
    const receiverSocketId = activeUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message", { from, message });
    }
  });
});

app.post("/register", async (req, res) => {
  const { userId, password } = req.body;
  try {
    await db.query("INSERT INTO users (user_id, password) VALUES ($1, $2)", [userId, password]);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

app.post("/login", async (req, res) => {
  const { userId, password } = req.body;
  try {
    const result = await db.query("SELECT * FROM users WHERE user_id = $1 AND password = $2", [userId, password]);
    if (result.rows.length > 0) res.sendStatus(200);
    else res.sendStatus(401);
  } catch (err) {
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const { from, to, message } = req.body;
  try {
    await db.query("INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)", [from, to, message]);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY id ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.sendStatus(500);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
