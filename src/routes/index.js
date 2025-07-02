const express = require('express');
const router = express.Router();
const apiChatRoute = require('./api/chat');

const chatRoute = require('./chat');

router.use('/', chatRoute);
router.use('/api/chat', apiChatRoute);

module.exports = router;
