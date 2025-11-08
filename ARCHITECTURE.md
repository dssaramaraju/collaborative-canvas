
# ARCHITECTURE

## 1) Data Flow Diagram (High-level)

```
[Pointer/Touch Events]
        |
        v
   Canvas (client) --(batched point segments)--> Socket.io <---> Server (operation log)
        |                                                     |
        '--- local preview -----------------------------------'
        |
        '--- on server ack/broadcast --> apply op in order --> Re-render
```

- Clients **locally predict** strokes for instant feedback.
- Server assigns a **monotonic sequence id** per operation, ensuring global order.
- All clients apply operations **in the same order** for consistency.

## 2) WebSocket Protocol

**Events from Client → Server**
- `cursor:move` `{ x, y }` (throttled)
- `stroke:start` `{ tempId, color, width, mode }`
- `stroke:segment` `{ tempId, points: [{x,y,t}, ...] }` (batched)
- `stroke:end` `{ tempId }`
- `history:undo` (no payload; server undoes latest non-undone op)
- `history:redo` (no payload; server redoes latest undone op)

**Events from Server → Client**
- `init` `{ userId, room, users: [...], ops: [...], seq }`
- `user:join` `{ userId, name, color }`
- `user:leave` `{ userId }`
- `cursor:move` `{ userId, x, y }`
- `op:apply` `{ op }`          # apply an operation
- `op:reconcile` `{ tempId, opId, seq }` # (optional) link temp stroke to official op
- `history:undo` `{ opId }`
- `history:redo` `{ opId }`

## 3) Undo/Redo Strategy (Global)

- Server maintains a **stack-like log** of operations: `ops[]`
- An op is one of:
  - `stroke` (draw) with polyline points
  - `erase` (eraser strokes use `mode='erase'` and `globalCompositeOperation='destination-out'`)
- `undo` finds the **latest applied** op and marks it `undone=true`.
- `redo` finds the latest undone op and marks it `undone=false`.
- Clients **re-render** from the operation log (skipping undone ops).
- Ordering ensures global consistency regardless of author.

## 4) Performance Decisions

- **Batching**: Points sent in segments (e.g., every 16ms or when buffer > N points).
- **Local Prediction**: Draw immediately, then reconcile when server confirms `opId`.
- **Redraw Policy**: Incremental render while drawing; full re-render only on undo/redo to keep logic simple and robust.
- **Cursors**: Throttled with `requestAnimationFrame` to ~60Hz max.

## 5) Conflict Resolution (Overlapping Areas)

- Deterministic order via server sequence; later ops appear on top.
- Eraser is compositing-based; it removes pixels from current buffer without special merging logic.
- Because order is consistent, all clients converge on the same bitmap.

## 6) Scaling Notes (Beyond MVP)

- Persist ops to Redis/Postgres; load ops on join.
- Backpressure + rate limiting per room for abusive clients.
- Use **rooms** in Socket.io for isolation; sharded Node instances.
- Consider **tiles** + **dirty rectangles** to avoid full-canvas redraws on heavy history.
