import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
app.use(express.static(join(__dirname, 'static')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'static', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('join', (username) => {
    socket.username = username;
    io.emit('userJoined', username);
  });

  socket.on('message', (data) => {
    io.emit('message', data);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      console.log('user disconnected', socket.username);
    }
  });
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
