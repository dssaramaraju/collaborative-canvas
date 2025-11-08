
# Real-Time Collaborative Drawing Canvas

A multi-user drawing app built with **Vanilla JS + HTML5 Canvas** on the frontend and **Node.js + Socket.io** on the backend.  
Supports **real-time sync**, **user cursors**, **brush/eraser**, and **global undo/redo** via an operation log.

## ✨ Features
- Brush & eraser, colors, stroke width
- Real-time drawing sync (client-side prediction + server ordering)
- User indicators (live cursors with names/colors)
- **Global undo/redo** (last-applied operation regardless of author)
- Room support (via `?room=...` query)
- Basic conflict resolution using ordered operation log and compositing

## 🚀 Quick Start

```bash
npm install
npm start
# Server at http://localhost:3000
# Open two browser tabs to test multi-user sync
```

Open: `http://localhost:3000/?name=Alice&room=demo` and another `?name=Bob&room=demo`

## 🧪 Testing with Multiple Users
- Open multiple tabs (or devices) with the same `room` query param
- Draw simultaneously; watch strokes sync in real-time
- Try Undo/Redo buttons to see global history updates

## 🌐 Deployment
### Render (recommended for speed)
1. Push to GitHub
2. Create a **Web Service** on Render → Connect your repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Visit the Render URL (e.g., `https://your-app.onrender.com`)

### Heroku (alternative)
1. Ensure `Procfile` exists (included)
2. `heroku create`
3. `git push heroku main`
4. Open app URL

### Vercel (single service)
- Vercel prefers static/frontends; since this app needs websockets and Node server, use **Vercel** only if configured with serverless functions (not included here). Prefer **Render** or **Railway**.

## 🧱 Project Structure
```
collaborative-canvas/
├── client/
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── canvas.js
│   └── websocket.js
├── server/
│   ├── server.js
│   ├── rooms.js
│   └── drawing-state.js
├── package.json
├── Procfile
├── .gitignore
├── README.md
└── ARCHITECTURE.md
```

## 🔧 Known Limitations
- In-memory state (resets on server restart)
- Full-canvas redraw after history mutations (fine for demos; can be optimized with tiles/dirty regions)
- Latency compensation is minimal (client draws locally then reconciles)

## ⏱️ Time Spent
This scaffold was generated to get you production-ready **tonight**. You can extend features as needed.
