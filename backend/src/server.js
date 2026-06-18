const http = require('http');
const socketio = require('socket.io');
const app = require('./app');

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('join_shipment', (shipmentId) => {
    socket.join(shipmentId);
    console.log(`📦 Client joined shipment: ${shipmentId}`);
  });

  socket.on('update_location', (data) => {
    // data: { shipmentId, location: { lat, lng } }
    io.to(data.shipmentId).emit('location_updated', data.location);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected');
  });
});

// Attach io to app so it can be used in controllers
app.set('io', io);

// Catch async Chrome crash on Render (whatsapp-web.js throws after tick)
process.on('unhandledRejection', (err) => {
  if (err?.message?.includes('Could not find Chrome')) {
    console.log('⚠️ WhatsApp disabled (Chrome not available on this platform)');
    return;
  }
  console.error('❌ Unhandled Rejection:', err.message);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 SKRT Server running on port ${PORT}`);
});
