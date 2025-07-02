require('dotenv').config();

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const path = require('path');
const twitchChat = require("./src/modules/twitchChat");
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const routes = require('./src/routes');
app.use(routes);

twitchChat.initTwitchChat(io);
app.locals.messages = twitchChat.getMessages();

server.listen(port, () => {
  if (!process.env.TWITCH_CHANNEL || process.env.TWITCH_CHANNEL.trim() === '') {
    console.error('TWITCH_CHANNEL is not set in .env file.');
    process.exit(1);
  }
  console.log(`
    Listening to twitch channel: https://twitch.tv/${process.env.TWITCH_CHANNEL}
    Chat available at http://localhost:${port}/chat
    Chat with wide layout available at http://localhost:${port}/chat/wide`);
  if (process.env.DEBUG === 'true') {
    console.log(`Debug mode is ON`);
  }
  if (process.env.FETCH_PRONOUNS != 'true') {
    console.log(`
      Fetching pronouns is disabled`);
  }
  if (!process.env.TWITCH_CLIENT_ID && !process.env.TWITCH_ACCESS_KEY) {
    console.warn(`
      TWITCH_CLIENT_ID and TWITCH_ACCESS_KEY are not set, twitch profile pictures will not be fetched`);
  }
  console.log(`
    Press Ctrl+C to stop the server`);
});

app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
});
