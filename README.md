# 🎨 Real-Time Collaborative Drawing Canvas

A **multi-user, real-time drawing app** built with **Vanilla JavaScript + HTML5 Canvas** and **Node.js + Socket.io**.  
Features **live drawing sync**, **cursor indicators**, **brush/eraser with color & width**, and **global undo/redo** — all implemented **without frontend frameworks or drawing libraries**.

---

## 🚀 Live Demo & Repository

- **Live App:**  
  🔗 [https://collaborative-canvas-sa26.onrender.com](https://collaborative-canvas-sa26.onrender.com)

- **GitHub Repo:**  
  💻 [https://github.com/dssaramaraju/collaborative-canvas](https://github.com/dssaramaraju/collaborative-canvas)

> 🧩 **Quick Test:**  
> Open the demo link in two tabs — e.g., one as `Alice` and one as `Bob`.  
> Draw in one tab and watch it appear **instantly** in the other.

---

## ✨ Core Features

✅ **Drawing Tools:** Brush & Eraser, adjustable color and stroke width  
✅ **Real-time Sync:** Streams strokes as you draw (not after you finish)  
✅ **User Indicators:** Shows live cursors for all connected users  
✅ **Global Undo/Redo:** Shared operation log across all clients  
✅ **Room System:** Join with `?room=demo` or any custom name  
✅ **Touch Support:** Works seamlessly on mobile & tablets  
✅ **Conflict Handling:** Server-ordered operations with deterministic rendering  

---

## 🧭 How to Test (Multi-User)

1. Open two browser tabs:
   - [https://collaborative-canvas-sa26.onrender.com/?name=Alice&room=demo](https://collaborative-canvas-sa26.onrender.com/?name=Alice&room=demo)
   - [https://collaborative-canvas-sa26.onrender.com/?name=Bob&room=demo](https://collaborative-canvas-sa26.onrender.com/?name=Bob&room=demo)
2. Draw in one tab — strokes appear live in the other.
3. Change **color/width**, toggle **eraser**, or **undo/redo** — updates sync globally.
4. Move your mouse — other users see your **cursor and name**.

---

## ⚙️ Run Locally

```bash
git clone https://github.com/dssaramaraju/collaborative-canvas
cd collaborative-canvas
npm install
npm start
# App runs at http://localhost:3000/?name=Alice&room=demo
Open another tab with:

Copy code
http://localhost:3000/?name=Bob&room=demo

---

## 🧱 Project Structure

collaborative-canvas/
├── client/
│ ├── index.html
│ ├── style.css
│ ├── main.js
│ ├── canvas.js # Canvas drawing, cursors, preview rendering
│ └── websocket.js # Socket.io client connections
├── server/
│ ├── server.js # Express + Socket.io backend
│ ├── rooms.js # Room and user session management
│ └── drawing-state.js # Operation log, undo/redo state
├── package.json
├── Procfile
├── .gitignore
├── README.md
└── ARCHITECTURE.md

---

## 🧠 Architecture Overview

**Client → Server → Broadcast Flow**

User Input → Canvas.js → WebSocket.js → Socket.io → Server.js → Broadcast → Other Clients → Canvas Update


- **Client:** Sends drawing actions in small point batches  
- **Server:** Assigns global operation order and updates an operation log  
- **All Clients:** Apply operations in the same order to render an identical canvas

➡️ Full details: see **[ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## 🌐 Deployment

### ✅ Render (Recommended)
1. Push your repo to GitHub  
2. Create a new **Web Service** on [Render](https://render.com)  
3. **Build command:** `npm install`  
4. **Start command:** `node server/server.js`  
5. Open your live URL (e.g., `https://your-app.onrender.com`)

### ☁️ Heroku (Alternative)

heroku create
git push heroku main


> *A `Procfile` is included for Heroku deployment.*

---

## ⚡ Performance Highlights

- **Batched point streaming** to reduce network chatter  
- **Local prediction** for instant visual feedback (reconciled on server ack)  
- **Offscreen canvas** for fast full redraws during undo/redo  
- **RAF-throttled cursor updates** (≈60fps cap)

---

## ⚠️ Known Limitations

- In-memory state (resets on server restart)  
- Global Undo/Redo (by design for this assignment)  
- Full canvas redraw on undo/redo (fine for demo scale)  
- Minimal latency compensation (client-first rendering)

---

## 🕒 Time Spent (Approx.)

| Task | Time |
|------|------|
| Architecture & Design | 2 hrs |
| Core Implementation | 6 hrs |
| Testing & Debugging | 2 hrs |
| Documentation & Deployment | 1 hr |
| **Total** | **~11 hrs** |

---

## 👤 Author

**D S S A Ramaraju**  
🎨 Live Demo → https://collaborative-canvas-sa26.onrender.com 
💻 GitHub → https://github.com/dssaramaraju/collaborative-canvas
