// Canvas drawing + applying operation log

let ctx, canvas, offscreen;
let isDrawing = false;
let currentStroke = null;
let userId = null;
let opLog = [];
let users = new Map();

// Live preview for remote, in-progress strokes
let remoteStrokes = new Map(); // tempId -> { color, width, mode, lastPoint }

// Cursor overlay + user tracking
let cursorsLayer, cursors = new Map(), usersById = new Map();

function dprSetup(c) {
  const ratio = window.devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  c.width = Math.round(rect.width * ratio);
  c.height = Math.round(rect.height * ratio);
  const _ctx = c.getContext('2d');
  _ctx.scale(ratio, ratio);
  return _ctx;
}

function drawStrokeSegment(targetCtx, stroke, points) {
  targetCtx.save();
  targetCtx.lineCap = 'round';
  targetCtx.lineJoin = 'round';
  targetCtx.strokeStyle = stroke.color;
  targetCtx.lineWidth = stroke.width;
  if (stroke.mode === 'erase') {
    targetCtx.globalCompositeOperation = 'destination-out';
    targetCtx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    targetCtx.globalCompositeOperation = 'source-over';
  }
  targetCtx.beginPath();
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i+1];
    targetCtx.moveTo(p0.x, p0.y);
    targetCtx.lineTo(p1.x, p1.y);
  }
  targetCtx.stroke();
  targetCtx.restore();
}

function fullRedraw() {
  const c = offscreen.getContext('2d');
  c.clearRect(0,0,offscreen.width, offscreen.height);
  for (const op of opLog) {
    if (op.type === 'stroke' && !op.undone) {
      drawStrokeSegment(c, op, op.points);
    }
  }
  // blit to main canvas
  const main = ctx;
  main.save();
  main.setTransform(1,0,0,1,0,0);
  main.clearRect(0,0,canvas.width, canvas.height);
  main.drawImage(
    offscreen, 0, 0, offscreen.width, offscreen.height,
    0, 0, canvas.width, canvas.height
  );
  main.restore();
}

// ---------- Cursor helpers ----------
function ensureCursor(uid, color='white', name='') {
  if (cursors.has(uid)) return cursors.get(uid);
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.transform = 'translate(-50%, -50%)';
  el.style.font = '12px/1.2 system-ui';
  el.innerHTML = `
    <div style="width:10px;height:10px;border-radius:50%;background:${color};
                box-shadow:0 0 6px rgba(0,0,0,.4)"></div>
    <div style="margin-top:2px;color:#cbd5e1;background:#111827cc;
                padding:2px 6px;border-radius:6px">${name || 'User'}</div>
  `;
  cursorsLayer.appendChild(el);
  const rec = { el, color, name };
  cursors.set(uid, rec);
  return rec;
}

function placeCursor(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
}

// ------------------------------------

export function setupCanvas({ canvas: _canvas, socket, ui }) {
  canvas = _canvas;
  ctx = dprSetup(canvas);

  offscreen = document.createElement('canvas');
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  offscreen.width = rect.width * ratio;
  offscreen.height = rect.height * ratio;
  offscreen.getContext('2d').scale(ratio, ratio);

  // Cursor overlay div from index.html
  cursorsLayer = document.getElementById('cursors-layer');

  // UI handlers
  ui.undo.addEventListener('click', () => socket.emit('history:undo'));
  ui.redo.addEventListener('click', () => socket.emit('history:redo'));

  // Mouse/touch events
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y, t: performance.now() };
  }

  let rafPost = null;
  function postCursor(pos) {
    if (rafPost) return;
    rafPost = requestAnimationFrame(() => {
      socket.emit('cursor:move', pos);
      rafPost = null;
    });
  }

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const pos = getPos(e);
    const tempId = `tmp_${Math.random().toString(36).slice(2)}`;
    currentStroke = {
      tempId,
      color: ui.tool.value === 'eraser' ? '#000000' : ui.color.value,
      width: Number(ui.width.value),
      mode: ui.tool.value === 'eraser' ? 'erase' : 'draw',
      points: [pos]
    };
    socket.emit('stroke:start', { tempId, color: currentStroke.color, width: currentStroke.width, mode: currentStroke.mode });
  });

  canvas.addEventListener('mousemove', (e) => {
    const pos = getPos(e);
    postCursor(pos);
    if (!isDrawing || !currentStroke) return;
    currentStroke.points.push(pos);
    drawStrokeSegment(ctx, currentStroke, [currentStroke.points[currentStroke.points.length-2], pos]);
    if (currentStroke.points.length % 4 === 0) {
      const seg = currentStroke.points.slice(-4);
      socket.emit('stroke:segment', { tempId: currentStroke.tempId, points: seg });
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isDrawing || !currentStroke) return;
    isDrawing = false;
    socket.emit('stroke:end', { tempId: currentStroke.tempId });
    currentStroke = null;
  });

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const pos = getPos(e);
    const tempId = `tmp_${Math.random().toString(36).slice(2)}`;
    currentStroke = {
      tempId,
      color: ui.tool.value === 'eraser' ? '#000000' : ui.color.value,
      width: Number(ui.width.value),
      mode: ui.tool.value === 'eraser' ? 'erase' : 'draw',
      points: [pos]
    };
    socket.emit('stroke:start', { tempId, color: currentStroke.color, width: currentStroke.width, mode: currentStroke.mode });
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const pos = getPos(e);
    postCursor(pos);
    if (!currentStroke) return;
    currentStroke.points.push(pos);
    drawStrokeSegment(ctx, currentStroke, [currentStroke.points[currentStroke.points.length-2], pos]);
    if (currentStroke.points.length % 4 === 0) {
      const seg = currentStroke.points.slice(-4);
      socket.emit('stroke:segment', { tempId: currentStroke.tempId, points: seg });
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!currentStroke) return;
    socket.emit('stroke:end', { tempId: currentStroke.tempId });
    currentStroke = null;
  }, { passive: false });

  // -------- Socket bindings (called by websocket.js) --------
  function onInit(payload) {
    userId = payload.userId;
    // Track users for cursor colors/names
    usersById.clear();
    (payload.users || []).forEach(u => usersById.set(u.userId, u));
    // Load history and draw
    opLog = payload.ops || [];
    fullRedraw();
  }

  function onUserJoin(u) {
    usersById.set(u.userId, u);
  }

  function onUserLeave({ userId: uid }) {
    usersById.delete(uid);
    const rec = cursors.get(uid);
    if (rec) { rec.el.remove(); cursors.delete(uid); }
  }

  function onOpApply({ op }) {
    // Handle live remote stroke segments (real-time preview)
    if (op.type === 'stroke:segment') {
      const { tempId, points } = op;
      if (!points || points.length < 2) return;

      let s = remoteStrokes.get(tempId);
      if (!s) {
        // Preview style (final stroke will redraw with authoritative style)
        s = { color: '#ffffff', width: 3, mode: 'draw', lastPoint: null };
        remoteStrokes.set(tempId, s);
      }

      const seg = s.lastPoint ? [s.lastPoint, ...points] : points;
      drawStrokeSegment(ctx, s, seg);
      s.lastPoint = points[points.length - 1];
      return;
    }

    // Handle finalized stroke from server (official op)
    if (op.type === 'stroke') {
      opLog.push(op);
      // Clear any preview (best-effort; server doesn't send tempId here)
      // We full redraw to avoid any ghosting from previews.
      fullRedraw();
    }
  }

  function onUndo({ opId }) {
    const target = opLog.find(o => o.id === opId);
    if (target) target.undone = true;
    fullRedraw();
  }

  function onRedo({ opId }) {
    const target = opLog.find(o => o.id === opId);
    if (target) target.undone = false;
    fullRedraw();
  }

  // Public cursor move handler (wired in websocket.js)
  function onCursorMove({ userId: uid, x, y }) {
    if (!cursorsLayer) return;
    const u = usersById.get(uid) || {};
    const rec = ensureCursor(uid, u.color || '#fff', u.name || 'User');
    placeCursor(rec.el, x, y);
  }

  return {
    api: {
      onInit,
      onUserJoin,
      onUserLeave,
      onOpApply,
      onUndo,
      onRedo,
      onCursorMove
    }
  };
}
