
import { setupCanvas } from './canvas.js';
import { connect } from './websocket.js';

const params = new URLSearchParams(window.location.search);
const name = params.get('name') || `User${Math.floor(Math.random()*1000)}`;
const room = params.get('room') || 'demo';

document.getElementById('room').textContent = room;
document.getElementById('user-info').textContent = `You: ${name}`;

const socket = connect({ name, room });

const { api } = setupCanvas({
  canvas: document.getElementById('canvas'),
  socket,
  ui: {
    tool: document.getElementById('tool'),
    color: document.getElementById('color'),
    width: document.getElementById('width'),
    undo: document.getElementById('undo'),
    redo: document.getElementById('redo'),
    usersPanel: document.getElementById('users')
  }
});

window._canvasApi = api; // for debugging
