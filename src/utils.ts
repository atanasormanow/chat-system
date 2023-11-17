import { Socket } from "socket.io";
import { Rooms } from "./types.js";

// NOTE: Could be done with a single reduce
export function getUserRooms(socket: Socket, rooms: Rooms): string[] {
  return Object.entries(rooms)
    .filter(([_name, room]) => !!room.users[socket.id])
    .map(([name, _room]) => name);
}

