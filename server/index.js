require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const webhookRoutes = require('./routes/webhook');
const apiRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }});
app.set('io', io);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/webhook', webhookRoutes);
app.use('/api', apiRoutes);

// simple health
app.get('/', (req, res) => res.send({ ok:true, msg:'WhatsApp Web Clone Backend' }));

const MONGO = process.env.MONGO_URI || '';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> {
    console.log('Mongo connected');
    server.listen(PORT, ()=> console.log('Server running on', PORT));
  })
  .catch(err => {
    console.error('Mongo connection error:', err.message);
    console.log('Server will start without DB for local dev (routes may fail)');
    server.listen(PORT, ()=> console.log('Server running on', PORT));
  });

// basic socket logging
io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', ()=> console.log('socket disconnected', socket.id));
});
