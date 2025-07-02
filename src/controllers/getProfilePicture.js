const NodeCache = require("node-cache");
const { retryWithBackoff } = require("../utils/retry");

const cache = new NodeCache();

const twitchToken = process.env.TWITCH_ACCESS_KEY;
const twitchClientId = process.env.TWITCH_CLIENT_ID;
// the base64 is a transparent gif
const defaultProfilePicture = process.env.DEFAULT_PROFILE_PICTURE || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

const { logError, logDebug, logInfo } = require("../utils/logger");

async function fetchProfilePicture(userId) {
    const url = `https://api.twitch.tv/helix/users?login=${userId}`;
    const headers = {
        'Authorization': `Bearer ${twitchToken}`,
        'Client-Id': twitchClientId
    };

    if (!twitchToken || !twitchClientId) {
        return defaultProfilePicture;
    }

    const fetchOperation = async () => {
        const response = await fetch(url, { headers });
        if (response.status === 403) {
            logError(`403 Forbidden: Invalid Twitch token or client ID, returning default profile picture`);
            return defaultProfilePicture;
        } else if (response.status === 404) {
            logError(`404 Not Found: User ${userId} not found`);
            return defaultProfilePicture;
        } else if (!response.status == 400) {
            logError(`400 Bad Request: Invalid request, returning default profile picture`);
            return defaultProfilePicture;
        } else if (!response.ok) {
            logError(`Error fetching profile picture: ${response.statusText}, status: ${response.status}`);
            throw new Error(`Error fetching profile picture: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0]?.profile_image_url || defaultProfilePicture;
    };

    try {
        const profilePicture = await retryWithBackoff(fetchOperation, 3, 250, true);
        return profilePicture;
    } catch (error) {
        logError(`Error fetching profile picture for user ${userId}: ${error} after 5 retries`);
        return defaultProfilePicture;
    }
}

// sometimes after getting a pfp back from twitch it turns out it's a broken image, 
async function validateProfilePicture(url) {
    logDebug(`Validating profile picture URL: ${url}`);
    if (!url || url === defaultProfilePicture) {
        return defaultProfilePicture;
    }

    try {
        const response = await fetch(url, { method: 'HEAD' });
        logDebug(`Response status for ${url}: ${response.status}`);
        if (response.ok) {
            return url;
        } else {
            logError(`Invalid profile picture URL: ${url}, status: ${response.status}`);
            return defaultProfilePicture;
        }
    } catch (error) {
        logError(`Error validating profile picture URL: ${error}`);
        return defaultProfilePicture;
    }
}



async function getProfilePicture(userId) {
    const cachedPicture = cache.get(userId);
    if (cachedPicture) {
        return cachedPicture;
    } else {
        logDebug(`Cache miss for user ${userId}, fetching profile picture`);
        const profilePicture = await fetchProfilePicture(userId);
        const validatedPicture = await validateProfilePicture(profilePicture);
        cache.set(userId, validatedPicture, 1800); // 30 min cache
        return validatedPicture;
    }
}

module.exports = getProfilePicture;
