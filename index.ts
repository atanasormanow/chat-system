import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

// TODO: add more types here and there

const port = process.env.PORT;

const app = express();
const server = createServer(app);
const io = new Server(server);

const users: { [key: string]: string } = {};

// I'll need these in the future:
// app.use(cors);
// app.use(express.urlencoded());

// NOTES:
// Hold all rooms and users in memory.
// Add some abstraction and separate logic.
//
// TODO: endpoint for the "lobby" where all rooms and users are
// TODO: endpoint for some "room" which could be a single user as well
// TODO: Should add persistence with redis adapter.
//
// At the moment this is the one and only "room" - "chat-message"
app.get("/", (req, res) => {
  res.sendFile(new URL("../src/views/index.html", import.meta.url).pathname);
});

io.on("connection", (socket) => {

  socket.on("chat-message", (msg) => {
    socket.broadcast.emit("chat-message", `${users[socket.id]}: ${msg}`);
    socket.emit("chat-message", `You: ${msg}`)
  });

  socket.on("user-connect", (name) => {
    users[socket.id] = name;
    socket.broadcast.emit("chat-message", `${name} joined`);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("chat-message", `${users[socket.id]} left`)
  });

});

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
