import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

// TODO: add more types here and there
// TODO: move types in separate file

const port = process.env.PORT;

const app = express();
const server = createServer(app);
const io = new Server(server);

const users: { [key: string]: string } = {};
const rooms: { [key: string]: { users: string[] } } = {};

app.set("views", new URL("../src/views", import.meta.url).pathname);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// NOTES:
// Hold all rooms and users in memory.
// Add some abstraction and separate logic.
//
// TODO: Should add persistence with redis adapter.
//
// At the moment "chat-message" is the one and only room
app.get("/", (_req, res) => {
  res.render("index", { rooms })
});

app.get("/:room", (req, res) => {
  const room = req.params.room

  if (!rooms[room]) {
    return res.redirect("/");
  }

  res.render("room", { room })
});

app.post("/:room", (req, res) => {
  const room = req.body.room;

  if (!!rooms[room]) {
    return res.redirect("/");
  }

  rooms[room] = { users: [] };
  res.render("room", { room })
  io.emit("room-created", room);
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
