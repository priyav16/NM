// server.js (backend)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public')); // optional: serve static files

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

// in-memory stores (demo)
const users = new Map(); // socketId -> username
const messages = [];     // { id, username, text, ts }

io.on('connection', (socket) => {
  console.log('Connected', socket.id);

  socket.on('join', (username) => {
    users.set(socket.id, username);
    // send recent history
    socket.emit('history', messages.slice(-200));
    // notify everyone
    io.emit('users', Array.from(users.values()));
    io.emit('system', `${username} joined`);
  });

  socket.on('message', (text) => {
    const username = users.get(socket.id) || 'Anonymous';
    const msg = { id: Date.now() + '-' + Math.random(), username, text, ts: Date.now() };
    messages.push(msg);
    io.emit('message', msg);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    if(username){
      io.emit('users', Array.from(users.values()));
      io.emit('system', `${username} left`);
    }
    console.log('Disconnected', socket.id);
  });
});

app.get('/', (req, res) => res.send('Socket.IO chat server running'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log('Server running on', PORT));
