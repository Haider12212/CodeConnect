const socket = io("http://localhost:3000/");

socket.on('connection', () => {
    console.log('connected');
    }
);

