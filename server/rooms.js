
import { createDrawingState } from './drawing-state.js';

function randColor() {
  const hues = [0, 40, 200, 120, 280, 320, 160, 20, 240];
  const h = hues[Math.floor(Math.random() * hues.length)];
  return `hsl(${h} 85% 55%)`;
}

export function createRoomsManager() {
  const rooms = new Map(); // roomName -> { users: Map(socketId -> user), state }

  function ensure(roomName) {
    if (!rooms.has(roomName)) {
      rooms.set(roomName, { users: new Map(), state: createDrawingState() });
    }
    return rooms.get(roomName);
  }

  function join(roomName, socketId, name) {
    const room = ensure(roomName);
    const user = { userId: socketId, name, color: randColor() };
    room.users.set(socketId, user);
    return { user, state: room.state };
  }

  function leave(roomName, socketId) {
    const room = rooms.get(roomName);
    if (!room) return;
    room.users.delete(socketId);
    if (room.users.size === 0) {
      // optional: cleanup room
      // rooms.delete(roomName);
    }
  }

  function listUsers(roomName) {
    const room = rooms.get(roomName);
    if (!room) return [];
    return Array.from(room.users.values());
  }

  return { join, leave, listUsers };
}
