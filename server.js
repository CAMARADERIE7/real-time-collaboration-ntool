const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

function generateUserId() {
  return 'User-' + Math.floor(Math.random() * 10000);
}

let users = {};  // Map of ws => userId
let content = ''; // Store the latest document content

function broadcast(data, exceptWs = null) {
  wss.clients.forEach(client => {
    if (client !== exceptWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', (ws) => {
  const userId = generateUserId();
  users[ws] = userId;

  // Send welcome message with assigned userId
  ws.send(JSON.stringify({ type: 'welcome', userId }));

  // Send current user list
  const userList = Object.values(users);
  ws.send(JSON.stringify({ type: 'userlist', users: Object.fromEntries(Object.entries(users).map(([k,v]) => [v,v])) }));

  // Send current document content
  ws.send(JSON.stringify({ type: 'content', userId: 'server', content }));

  // Notify others that a new user joined
  broadcast({ type: 'userJoined', userId }, ws);

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      console.error('Invalid JSON:', message);
      return;
    }

    if (data.type === 'content') {
      content = data.content;
      broadcast({ type: 'content', userId, content }, ws);
    }
  });

  ws.on('close', () => {
    const leavingUserId = users[ws];
    delete users[ws];
    broadcast({ type: 'userLeft', userId: leavingUserId });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
