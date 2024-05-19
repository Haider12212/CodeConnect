import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateRoomId, rooms, addUserToRoom, removeUserFromRoom, getRoomUsers, getTotalUsers } from './rooms.js';
import { addUser, removeUser, getUsersInRoom } from './users.js';

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('join', ({ username, roomId }) => {
    if (getRoomUsers(roomId).find(user => user.username === username)) {
      socket.emit('error', 'Username already taken in this room');
      return;
    }

    const user = addUser({ id: socket.id, username, roomId });
    socket.join(roomId);
    addUserToRoom(roomId, user);

    io.to(roomId).emit('userJoined', { username, roomId, users: getUsersInRoom(roomId) });
    io.emit('updateUserCount', getTotalUsers());

    socket.on('message', (message) => {
      io.to(roomId).emit('message', { username, message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    });

    socket.on('file', (fileData) => {
      io.to(roomId).emit('file', { username, fileData, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    });

    socket.on('disconnect', () => {
      const user = removeUser(socket.id);
      if (user) {
        removeUserFromRoom(user.roomId, socket.id);
        io.to(user.roomId).emit('userLeft', { username: user.username, users: getUsersInRoom(user.roomId) });
        io.emit('updateUserCount', getTotalUsers());
      }
    });
  });

  // Listen for file meta data from the client
  socket.on("file-meta", function (data) {
    socket.in(data.uid).emit("fs-meta", data.metadata);
  });

  // Listen for the "fs-start" event from the client
  socket.on("fs-start", function (data) {
    socket.in(data.uid).emit("fs-share", {});
  });

  // Listen for the "file-raw" event from the client
  socket.on("file-raw", function (data) {
    socket.in(data.uid).emit("fs-share", data.buffer);
  });

  socket.on('createRoom', () => {
    const roomId = generateRoomId();
    socket.emit('roomCreated', roomId);
  });
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
