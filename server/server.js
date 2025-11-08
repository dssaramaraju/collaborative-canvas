
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createRoomsManager } from './rooms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});

const rooms = createRoomsManager();

io.on('connection', (socket) => {
  const { name = 'Guest', room: roomName = 'default' } = socket.handshake.query;
  const { user, state } = rooms.join(roomName, socket.id, String(name));

  socket.join(roomName);

  // Send initial state
  socket.emit('init', {
    userId: user.userId,
    room: roomName,
    users: rooms.listUsers(roomName),
    ops: state.getOps(),
    seq: state.getSeq()
  });

  // Notify others
  socket.to(roomName).emit('user:join', { userId: user.userId, name: user.name, color: user.color });

  // Cursor moves (throttled client-side)
  socket.on('cursor:move', (data) => {
    socket.to(roomName).emit('cursor:move', { userId: user.userId, ...data });
  });

  // Stroke lifecycle
  socket.on('stroke:start', ({ tempId, color, width, mode }) => {
    state.startStroke(user.userId, tempId, { color, width, mode });
  });

  socket.on('stroke:segment', ({ tempId, points }) => {
    state.addStrokePoints(tempId, points);
    // Optional: broadcast in-progress segment (disabled by default in client)
    socket.to(roomName).emit('op:apply', {
      op: { type: 'stroke:segment', tempId, points }
    });
  });

  socket.on('stroke:end', ({ tempId }) => {
    const op = state.finalizeStroke(tempId);
    if (!op) return;
    io.to(roomName).emit('op:apply', { op });
  });

  socket.on('history:undo', () => {
    const undone = state.undo();
    if (undone) {
      io.to(roomName).emit('history:undo', { opId: undone.id });
    }
  });

  socket.on('history:redo', () => {
    const redone = state.redo();
    if (redone) {
      io.to(roomName).emit('history:redo', { opId: redone.id });
    }
  });

  socket.on('disconnect', () => {
    rooms.leave(roomName, socket.id);
    socket.to(roomName).emit('user:leave', { userId: user.userId });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
