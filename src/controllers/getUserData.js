const { logDebug, logInfo, logError } = require('../utils/logger');

function getUserBadge(extra, channel) {
        logDebug(`getUserBadge: userState: ${JSON.stringify(extra)}, channel: ${channel}`);
        if (extra.username == channel) {
                return "broadcaster"
        }
        else if (extra.mod) {
                return "moderator"
        }
        else if (extra.subscriber) {
                return "subscriber"
        }
        else {
                return "user";
        }
}

module.exports = getUserBadge;