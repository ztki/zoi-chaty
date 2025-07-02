const express = require('express');
const router = express.Router();
const getUserBadge = require('../../controllers/getUserData');
const getPronouns = require('../../controllers/getPronouns');
const getProfilePicture = require('../../controllers/getProfilePicture');
const getMessageHTML = require('../../controllers/getMessageHTML');
const { logDebug, logInfo, logError } = require('../../utils/logger');

router.get('/', (req, res) => {
    logDebug(`Received GET request: ${JSON.stringify(req.query)}`);
    res.json({ message: 'Get your hands off me' });
});

router.post('/', express.json(), async (req, res) => {
    try {
        logDebug(`Received POST request with body: ${JSON.stringify(req.body)}`);
        const message = await getMessageHTML(req.body.message, req.body.extra.userState, req.body.extra.messageEmotes)

        logDebug(`Processing Badge`);
        const badge = getUserBadge(req.body.extra.userState, req.body.extra.channel);

        // need to user username not display name (req.body.user) for pronouns and profile picture
        logDebug(`Processing Pronouns`);
        const pronoun = await getPronouns(req.body.extra.username);

        logDebug(`Processing Profile Picture`);
        const profilePicture = await getProfilePicture(req.body.extra.username);
        const id = req.body.extra.id

        logDebug(
            "\nuser: " + req.body.user + "\nmessage: " + message + "\nbadge: " + badge +
            "\npronoun: " + pronoun + "\nprofilePicture: " + profilePicture + "\nid: " + id
        )

    res.json({ message, badge, pronoun, profilePicture, id });
    } catch (error) {
        logError(`chat.js Error processing POST request: ${error}`);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
});

module.exports = router;
