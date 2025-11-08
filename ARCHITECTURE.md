# 🧱 ARCHITECTURE.md  
## Real-Time Collaborative Drawing Canvas

---

## 📋 Overview

This document explains the architecture, data flow, WebSocket protocol, undo/redo logic, and performance considerations behind the **Real-Time Collaborative Drawing Canvas** project.  

The goal is to enable **multiple users** to draw simultaneously on a shared HTML5 canvas with **real-time synchronization**, **consistent state**, and **smooth user experience** — all built using **Vanilla JavaScript + Node.js + Socket.io**.

---

## 🏗️ System Architecture

### **High-Level Flow**

┌─────────────┐ ┌───────────────┐ ┌─────────────┐
│ Client A │◄──────►│ WebSocket │◄──────►│ Client B │
│ (Browser) │ │ Server (Node)│ │ (Browser) │
└─────────────┘ └───────────────┘ └─────────────┘
│ │ │
└──── canvas events ─────┴──── broadcast ops ─────┘


1. **Clients** capture drawing actions locally (brush, eraser, etc.).  
2. **Socket.io** transmits stroke data (`stroke:start`, `stroke:segment`, `stroke:end`) in real time.  
3. **Server** receives, timestamps, and rebroadcasts events to all clients in the same **room**.  
4. Each client updates their local canvas using the received stroke data.  
5. Global undo/redo and full redraws use a shared operation log to keep state consistent.

---

## 🔄 Data Flow Diagram

User Input → Canvas.js → WebSocket.js → Socket.io → Server.js → Broadcast → Other Clients → Canvas Update


1. **User Input** – Mouse/touch events are captured (`mousedown`, `mousemove`, `mouseup`).  
2. **Canvas.js** – Builds a stroke object `{ color, width, mode, points[] }`.  
3. **WebSocket.js** – Emits serialized stroke segments over the socket.  
4. **Server.js** – Validates, timestamps, and adds to global operation log.  
5. **Broadcast** – Sends stroke events to all clients in the same room.  
6. **Clients** – Draw incrementally or perform a full redraw if needed.  

---

## 📡 WebSocket Protocol

### **Outgoing (Client → Server)**

| Event | Payload | Description |
|--------|----------|-------------|
| `stroke:start` | `{ tempId, color, width, mode }` | Begins a new stroke |
| `stroke:segment` | `{ tempId, points[] }` | Sends stroke segments (batched points) |
| `stroke:end` | `{ tempId }` | Finalizes the stroke |
| `cursor:move` | `{ x, y }` | Sends live cursor position |
| `history:undo` | none | Request to undo last operation |
| `history:redo` | none | Request to redo undone operation |

### **Incoming (Server → Client)**

| Event | Payload | Description |
|--------|----------|-------------|
| `init` | `{ userId, ops[] }` | Sends initial canvas state |
| `op:apply` | `{ op }` | Broadcasts new operation (stroke, undo, redo) |
| `cursor:update` | `{ userId, pos }` | Updates user cursor positions |
| `user:join` / `user:leave` | `{ userId }` | Notifies room of user changes |

---

## 🧮 Data Structures

### **Operation Log (Server)**
```js
[
  { id: 1, type: 'stroke', user: 'Alice', points: [...], color: '#ff0000', undone: false },
  { id: 2, type: 'stroke', user: 'Bob', points: [...], color: '#00ff00', undone: false },
  { id: 3, type: 'undo', targetId: 1 },
]
