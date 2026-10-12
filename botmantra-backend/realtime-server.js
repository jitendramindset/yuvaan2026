const { Server } = require('socket.io');

function initRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.use((socket, next) => {
    // TODO: Replace with JWT verification for zero-trust sockets
    next();
  });

  io.on('connection', (socket) => {
    console.log('🔌 Realtime client connected', socket.id);

    socket.on('join_node', (nidHash) => {
      const room = nidHash || 'public';
      socket.join(room);
      socket.emit('kernel_update', {
        type: 'presence_update',
        payload: { room }
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Realtime client disconnected', socket.id);
    });
  });

  return io;
}

module.exports = { initRealtime };