
const express = require('express');
const Router = express.Router();


// controller import 
const {
    chatBotChatsController
} = require('../controllers/chatBot.controller.js');


Router.route('/chats').post(chatBotChatsController)



module.exports = Router;