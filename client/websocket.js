
export function connect({ name, room }) {
  const socket = io({ query: { name, room } });

  socket.on('init', (payload) => {
    if (window._canvasApi?.onInit) window._canvasApi.onInit(payload);
  });
  socket.on('user:join', (payload) => {
    if (window._canvasApi?.onUserJoin) window._canvasApi.onUserJoin(payload);
  });
  socket.on('user:leave', (payload) => {
    if (window._canvasApi?.onUserLeave) window._canvasApi.onUserLeave(payload);
  });
  socket.on('cursor:move', (payload) => {
  if (window._canvasApi?.onCursorMove) window._canvasApi.onCursorMove(payload);
  });
  socket.on('op:apply', (payload) => {
    if (window._canvasApi?.onOpApply) window._canvasApi.onOpApply(payload);
  });
  socket.on('history:undo', (payload) => {
    if (window._canvasApi?.onUndo) window._canvasApi.onUndo(payload);
  });
  socket.on('history:redo', (payload) => {
    if (window._canvasApi?.onRedo) window._canvasApi.onRedo(payload);
  });

  return socket;
}
