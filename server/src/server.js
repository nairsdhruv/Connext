import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initChatSockets } from './sockets/chatSocket.js';
import { startCleanupService } from './services/cleanupService.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const app = createApp();
    const httpServer = http.createServer(app);

    // Socket.IO configuration
    const io = new Server(httpServer, {
      cors: {
        origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST']
      },
      pingTimeout: 30000,
      pingInterval: 25000
    });

    // Initialize socket events
    initChatSockets(io);

    // Start background room expiry and maintenance service
    const cleanupInterval = startCleanupService();

    httpServer.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  🚀 Connext Server running on port ${PORT}`);
      console.log(`  🔗 API: http://localhost:${PORT}/api/health`);
      console.log(`  🌐 Client Origin: ${CLIENT_URL}`);
      console.log(`  📍 Live Navigation & OSRM Engine: Ready`);
      console.log(`  💬 Real-Time Socket.IO Chat: Ready`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n[Connext] Shutting down server gracefully...');
      clearInterval(cleanupInterval);
      httpServer.close(() => {
        console.log('[Connext] Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Connext Fatal] Server initialization failed:', error.message);
    process.exit(1);
  }
};

startServer();
