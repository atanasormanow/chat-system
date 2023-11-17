import express from "express";
import { createServer } from "http";
import { getUserRooms } from "./src/utils.js";
import { Server } from "socket.io";
import { Rooms } from "./src/types.js";

// TODO: Add some abstraction separate logic in layers
// TODO: Maybe use namespaces to distinguish user chats from room chats
//       Since some username and room name could match
//
// Bonus improvements:
// - Persistence and sessions
// - Scale up (use Redis Adapter or serverSideEmit with manual config)
// - Subscriptions (instead of listening only to the currently joined chat)

const port = process.env.PORT;

const app = express();
const server = createServer(app);
const io = new Server(server);

const rooms: Rooms = {};

app.set("views", new URL("../src/views", import.meta.url).pathname);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.render("index", { rooms: JSON.stringify(rooms) })
});

app.get("/:room", (req, res) => {
  const room = req.params.room

  if (!rooms[room]) {
    return res.redirect("/");
  }
  res.render("room", { room })
});

// TODO: How does a user know he is getting messaged ???
// The "user-connect" has to happen when index is opened
// And there should be "user-joined" for the per chat "joined" message
// app.get("/:pm", (req, res) => {
//   const user = req.params.user
//   //TODO: use namespace

// });

app.post("/:room", (req, res) => {
  const room = req.body.room;

  // In case a room with this name exists
  if (!!rooms[room]) {
    return res.redirect("/");
  }

  rooms[room] = { users: {} };
  res.render("room", { room })
  io.emit("room-created", room);
});


io.on("connection", (socket) => {

  socket.on("chat-message", ({ room, message }) => {
    const username = rooms[room].users[socket.id];
    socket.to(room).emit("chat-message", `${username}: ${message}`);
    socket.emit("chat-message", `You: ${message}`)
  });

  socket.on("user-connect", ({ room, name }) => {
    socket.join(room);
    rooms[room].users[socket.id] = name;
    socket.to(room).emit("chat-message", `${name} joined`);
  });

  socket.on("disconnect", () => {
    getUserRooms(socket, rooms).forEach(room => {
      socket.to(room).emit(
        "chat-message",
        `${rooms[room].users[socket.id]} left`
      );
    });
  });

  // For dev purposes only
  socket.onAny((event, ...args) => {
    console.log(event, args);
  });

});

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
