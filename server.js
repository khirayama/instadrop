const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const queryString = require('query-string');
const uaParser = require('ua-parser-js');

const rooms = {};

function generateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz012345689';
  const key = [
    chars[Math.floor(Math.random() * chars.length)],
    chars[Math.floor(Math.random() * chars.length)],
    chars[Math.floor(Math.random() * chars.length)],
    chars[Math.floor(Math.random() * chars.length)],
  ].join('')
  return key;
}

function getNewKey() {
  let key = generateKey();
  while (rooms[key]) {
    key = generateKey();
  }
  return key;
}

function generateUser(id, ua) {
  const animals = [
    {
      name: 'Dog',
      icon: '🐶',
    },
    {
      name: 'Cat',
      icon: '🐱',
    },
    {
      name: 'Wolf',
      icon: '🐺',
    },
    {
      name: 'Wolf',
      icon: '🐺',
    },
    {
      name: 'Wolf',
      icon: '🐺',
    },
    {
      name: 'Fox',
      icon: '🦊',
    },
    {
      name: 'Raccoon',
      icon: '🦝',
    },
    {
      name: 'Lion',
      icon: '🦁',
    },
    {
      name: 'Tiger',
      icon: '🐯',
    },
    {
      name: 'Horse',
      icon: '🐴',
    },
    {
      name: 'Unicorn',
      icon: '🦄',
    },
    {
      name: 'Zebra',
      icon: '🦓',
    },
    {
      name: 'Cow',
      icon: '🐮',
    }
  ];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const d = uaParser(ua);
  return {
    id,
    name: animal.name,
    icon: animal.icon,
    device: d.device.model || d.os.name,
    browser: d.browser.name,
  };
}

const port = process.env.PORT || 3000;

const app = express();
app.use(express.static('dist'));

const server = http.createServer(app);
const io = socketIO(server, {
  maxHttpBufferSize: 2e10, // 200MB
  // cors: {
  //   origin: 'http://192.168.68.117:1234',
  //   // methods: ['GET', 'POST']
  // },
});

io.on('connection', (socket) => {
  const query = queryString.parse(socket.handshake.headers.referer.split('?')[1])
  const id = socket.id;
  const user = generateUser(id, socket.handshake.headers['user-agent']);

  const key = query.key || getNewKey();
  if (rooms[key]) {
    rooms[key].push(user);
  } else {
    rooms[key] = [user]
  }

  const payload = {
    key,
    user,
  };
  io.to(id).emit('update:user', payload);
  io.to(rooms[key].map((u) => u.id)).emit('update:users', { users: rooms[key] });

  socket.on('disconnect', () => {
    rooms[key] = rooms[key].filter((u) => u.id !== socket.id);
    if (!rooms[key].length) {
      delete rooms[key];
    } else {
      io.to(rooms[key].map((u) => u.id)).emit('update:users', { users: rooms[key] });
    }
  });

  socket.on('share:files', (d, callback) => {
    if (d.to) {
      io.to(d.to).emit('share:files', { files: d.files });
      callback({ status: 'ok' });
    }
  });

  socket.on('share:text', (d, callback) => {
    if (d.to) {
      io.to(d.to).emit('share:text', { text: d.text });
      callback({ status: 'ok' });
    }
  });
});

server.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
