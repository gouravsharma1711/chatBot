
const express = require('express');
const Router = express.Router();


// controller import 
const {
    testingController,
    chatBotChatsController
} = require('../controllers/chatBot.controller.js');

Router.route('/testing').get(testingController);
Router.route('/chats').post(chatBotChatsController)



module.exports = Router;