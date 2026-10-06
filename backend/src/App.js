const express = require('express');
const app = express();
const cors = require('cors')


const chatBotRoutes = require('./routes/chatBot.routes.js');

// middlewares
app.use(express.json());
app.use(cors());
app.use('/api/v1/',chatBotRoutes);





module.exports = app;