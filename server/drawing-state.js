
// Global operation log with undo/redo and in-progress stroke assembly
export function createDrawingState() {
  let seq = 0;
  const ops = []; // { id, seq, type:'stroke', points, color,width,mode, authorId, undone? }
  const tempStrokes = new Map(); // tempId -> { authorId, color,width,mode, points: [] }

  function nextId() {
    seq += 1;
    return { id: `op_${seq}`, seq };
  }

  function startStroke(authorId, tempId, { color, width, mode }) {
    tempStrokes.set(tempId, { authorId, color, width, mode, points: [] });
  }

  function addStrokePoints(tempId, points) {
    const s = tempStrokes.get(tempId);
    if (!s) return;
    s.points.push(...points);
  }

  function finalizeStroke(tempId) {
    const s = tempStrokes.get(tempId);
    if (!s || s.points.length === 0) {
      tempStrokes.delete(tempId);
      return null;
    }
    tempStrokes.delete(tempId);
    const { id, seq: _seq } = nextId();
    const op = {
      id,
      seq: _seq,
      type: 'stroke',
      points: s.points,
      color: s.color,
      width: s.width,
      mode: s.mode || 'draw',
      authorId: s.authorId,
      undone: false,
      ts: Date.now()
    };
    ops.push(op);
    return op;
  }

  function undo() {
    for (let i = ops.length - 1; i >= 0; i--) {
      if (!ops[i].undone) {
        ops[i].undone = true;
        return ops[i];
      }
    }
    return null;
  }

  function redo() {
    for (let i = 0; i < ops.length; i++) {
      if (ops[i].undone) {
        ops[i].undone = false;
        return ops[i];
      }
    }
    return null;
  }

  function getOps() {
    return ops.map(o => ({ ...o }));
  }

  function getSeq() {
    return seq;
  }

  return {
    startStroke,
    addStrokePoints,
    finalizeStroke,
    undo,
    redo,
    getOps,
    getSeq
  };
}
