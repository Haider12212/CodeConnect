import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = 3000 || process.env.PORT;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },

});

function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.get('/', (req, res) => {
  res.send('Hello World');
});


io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log(`server running at ${PORT}`);
});
