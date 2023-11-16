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
// Each room has a list of users (their names ?)
const rooms: { [key: string]: { users: string[] } } = {
  room1: { users: [] },
  room2: { users: [] },
  room3: { users: [] }
};

// I'll need these in the future:
// app.use(cors);

app.set("views", new URL("../src/views", import.meta.url).pathname);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// NOTES:
// Hold all rooms and users in memory.
// Add some abstraction and separate logic.
//
// TODO: endpoint for the "lobby" where all rooms and users are
// TODO: endpoint for some "room" which could be a single user as well
// TODO: Should add persistence with redis adapter.
//
// At the moment "chat-message" is the one and only room
app.get("/", (_req, res) => {
  res.render("index", { rooms: rooms })
});

app.get("/:room", (req, res) => {
  res.render("room", { room: req.params.room })
});

app.post("/:room", (req, res) => {
  if(rooms[req.body.room] === null) {
    rooms[req.body.room] = { users: [] };
  }
  // Go to the room even if it existed ?
  // Or go back to index ?
  res.render("room", { room: req.body.room })
  // TODO: send message so the other users' room lists get updated
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
