import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

// TODO: add more types here and there
// TODO: move types in separate file

const port = process.env.PORT;

const app = express();
const server = createServer(app);
const io = new Server(server);

const rooms: { [key: string]: { users: { [key: string]: string } } } = {};

app.set("views", new URL("../src/views", import.meta.url).pathname);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// NOTES:
// Add some abstraction and separate logic.
//
// TODO: Maybe add persistence with redis adapter.
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
    getUserRooms(socket).forEach(room => {
      socket.to(room).emit(
        "chat-message",
        `${rooms[room].users[socket.id]} left`
      );
    });
  });

});


// NOTE: Could be done with a single reduce as well
function getUserRooms(socket: Socket): string[] {
  return Object.entries(rooms)
    .filter(([name, room]) => !!room.users[socket.id])
    .map(([name, _room]) => name);
}

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
