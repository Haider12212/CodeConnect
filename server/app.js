import express from 'express';
import http from 'http';
import { fileURLToPath } from 'url';  // Use 'url' instead of 'node:url'
import { dirname, join } from 'path'; // Use 'path' instead of 'node:path'
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Convert import.meta.url to a file path
// path is static folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



app.get('/', (req, res) => {
  res.sendFile(join(__dirname, './static/index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
