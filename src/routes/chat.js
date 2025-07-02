const express = require('express');
const router = express.Router();
const twitchChat = require("../modules/twitchChat");

router.get('/chat', (req, res) => {
    const messages = twitchChat.getMessages();
    res.render('index', { messages });
});

// lobattWide
router.get('/chat/wide', (req, res) => {
    const messages = twitchChat.getMessages();
    res.render('wide', { messages });
});

module.exports = router;
