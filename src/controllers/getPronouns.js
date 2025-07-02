const NodeCache = require("node-cache");
const { logError } = require("../utils/logger");
const { retryWithBackoff } = require("../utils/retry");

const cache = new NodeCache();

async function getPronouns(user) {
    if (process.env.FETCH_PRONOUNS !== "true") {
        return Promise.resolve(null);
    }
    user = user.trim().toLowerCase();

    if (cache.has(user)) {
        return Promise.resolve(cache.get(user));
    } else {
        const fetchPronouns = async () => {
            const response = await fetch(`https://pronouns.alejo.io/api/users/${user}`);
            if (!response.ok) {
                throw new Error(`Error fetching pronouns: ${response.statusText}`);
            }
            const data = await response.json();
            return data[0]?.pronoun_id || "unknown";
        };

        try {
            const pronounId = await retryWithBackoff(fetchPronouns, 3, 250, true);
            cache.set(user, pronounId, 1800); //30 min cache
            return pronounId;
        } catch (error) {
            logError(`Error fetching pronouns for user ${user}: ${error}`);
            throw error;
        }
    }
}

module.exports = getPronouns;