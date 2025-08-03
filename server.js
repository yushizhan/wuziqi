// Custom Next.js server with Socket.IO support

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3001;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room management state
const rooms = new Map();
const playerRooms = new Map(); // socketId -> roomId

// Generate 6-digit room ID
function generateRoomId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : false,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create room
    socket.on('create-room', (callback) => {
      const roomId = generateRoomId();
      const room = {
        id: roomId,
        host: socket.id,
        hostReady: false,
        guestReady: false,
        gameStarted: false,
        createdAt: Date.now()
      };

      rooms.set(roomId, room);
      playerRooms.set(socket.id, roomId);
      socket.join(roomId);

      console.log(`Room created: ${roomId} by ${socket.id}`);
      callback({ 
        success: true, 
        roomId, 
        isHost: true, 
        playerRole: 'black' 
      });
    });

    // Join room
    socket.on('join-room', (roomId, callback) => {
      const room = rooms.get(roomId);
      
      if (!room) {
        callback({ 
          success: false, 
          error: `Room ${roomId} does not exist. Please check the room number or ask the host to create the room again.` 
        });
        return;
      }

      if (room.guest) {
        callback({ 
          success: false, 
          error: `Room ${roomId} is full. Only two players are allowed per room.` 
        });
        return;
      }

      // Add guest to room
      room.guest = socket.id;
      playerRooms.set(socket.id, roomId);
      socket.join(roomId);

      console.log(`Player ${socket.id} joined room: ${roomId}`);
      
      // Notify host
      socket.to(roomId).emit('player-joined', {
        guestId: socket.id,
        roomId
      });

      callback({ 
        success: true, 
        roomId, 
        isHost: false, 
        playerRole: 'white' 
      });
    });

    // Player ready
    socket.on('player-ready', () => {
      const roomId = playerRooms.get(socket.id);
      const room = rooms.get(roomId || '');
      
      if (!room) return;

      if (room.host === socket.id) {
        room.hostReady = true;
      } else if (room.guest === socket.id) {
        room.guestReady = true;
      }

      // Notify all players in room
      io.to(roomId).emit('player-ready-update', {
        hostReady: room.hostReady,
        guestReady: room.guestReady
      });

      // Start game if both players are ready
      if (room.hostReady && room.guestReady && !room.gameStarted) {
        room.gameStarted = true;
        io.to(roomId).emit('game-start');
        console.log(`Game started in room: ${roomId}`);
      }
    });

    // Game message
    socket.on('game-message', (message) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) {
        console.log('No room found for socket:', socket.id);
        return;
      }

      console.log(`Game message in room ${roomId}:`, message.type, message.data);

      // Broadcast to other players in the room
      socket.to(roomId).emit('game-message', {
        ...message,
        senderId: socket.id,
        timestamp: Date.now()
      });
      
      console.log(`Message broadcasted to room ${roomId} from ${socket.id}`);
    });

    // Leave room
    socket.on('leave-room', () => {
      const roomId = playerRooms.get(socket.id);
      if (roomId) {
        handlePlayerLeave(socket.id, roomId);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const roomId = playerRooms.get(socket.id);
      if (roomId) {
        handlePlayerLeave(socket.id, roomId);
      }
    });

    function handlePlayerLeave(socketId, roomId) {
      const room = rooms.get(roomId);
      if (!room) return;

      playerRooms.delete(socketId);

      if (room.host === socketId) {
        // Host left, notify guest and cleanup room
        if (room.guest) {
          io.to(room.guest).emit('host-disconnected');
          playerRooms.delete(room.guest);
        }
        rooms.delete(roomId);
        console.log(`Host left, room ${roomId} deleted`);
      } else if (room.guest === socketId) {
        // Guest left, notify host and reset room
        room.guest = undefined;
        room.guestReady = false;
        room.gameStarted = false;
        io.to(room.host).emit('guest-disconnected');
        console.log(`Guest left room: ${roomId}`);
      }
    }
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});