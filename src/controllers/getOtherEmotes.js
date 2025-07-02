const NodeCache = require('node-cache');
const { EmoteFetcher, EmoteParser } = require('@mkody/twitch-emoticons');
const { logDebug, logInfo, logError } = require('../utils/logger');

const emoteCache = new NodeCache({ stdTTL: 3600 });

// 
const channelId = 24729468;

const fetcher = new EmoteFetcher("", "");
const parser = new EmoteParser(fetcher, {
    template: '<img alt="{name}" src="{link}">',
    match: /(\w+)+?/g
});

const providerList = process.env.EMOTE_PROVIDERS_LIST
    ? process.env.EMOTE_PROVIDERS_LIST.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
    : [];

const emoteProviders = {
    bttv: providerList.includes("bttv"),
    sevenTV: providerList.includes("7tv"),
    ffz: providerList.includes("ffz"),
    bttvChannel: providerList.includes("bttvChannel"),
    sevenTVChannel: providerList.includes("7tvChannel"),
    ffzChannel: providerList.includes("ffzChannel")
};

async function fetchAndCacheEmotes() {
    const cacheKey = `emotes_${channelId}`;
    const cachedEmotes = emoteCache.get(cacheKey);

    if (cachedEmotes) {
        logDebug('Emotes loaded from cache.');
        return cachedEmotes;
    }

    try {
        const emotePromises = [];

        if (emoteProviders.bttv) {
            emotePromises.push(
                fetcher.fetchBTTVEmotes().catch(err => {
                    logError('Error fetching global BTTV emotes:', err);
                    return [];
                })
            );
        }
        if (emoteProviders.bttvChannel) {
            emotePromises.push(
                fetcher.fetchBTTVEmotes(channelId).catch(err => {
                    logError(`Error fetching BTTV emotes for channel ${channelId}:`, err);
                    return [];
                })
            );
        }

        if (emoteProviders.sevenTV) {
            emotePromises.push(
                fetcher.fetchSevenTVEmotes().catch(err => {
                    logError('Error fetching global 7TV emotes:', err);
                    return [];
                })
            );
        }
        if (emoteProviders.sevenTVChannel) {
            emotePromises.push(
                fetcher.fetchSevenTVEmotes(channelId).catch(err => {
                    logError(`Error fetching 7TV emotes for channel ${channelId}:`, err);
                    return [];
                })
            );
        }

        if (emoteProviders.ffz) {
            emotePromises.push(
                fetcher.fetchFFZEmotes().catch(err => {
                    logError('Error fetching global FFZ emotes:', err);
                    return [];
                })
            );
        }
        if (emoteProviders.ffzChannel) {
            emotePromises.push(
                fetcher.fetchFFZEmotes(channelId).catch(err => {
                    logError(`Error fetching FFZ emotes for channel ${channelId}:`, err);
                    return [];
                })
            );
        }

        const emotes = await Promise.all(emotePromises);

        const allEmotes = emotes.flat();
        emoteCache.set(cacheKey, allEmotes);
        logDebug('Emotes fetched and cached.');
        return allEmotes;
    } catch (err) {
        logError('Error fetching emotes:', err);
        throw err;
    }
}

async function getOtherEmotes(message) {
    logDebug(`getOtherEmotes called with \nmessage: ${message}`);

    try {
        await fetchAndCacheEmotes();

        const parsedMessage = parser.parse(message, 1);
        logDebug(`Parsed message: ${parsedMessage}`);
        return parsedMessage;
    } catch (err) {
        logError('Error in getOtherEmotes:', err);
        return message;
    }
}

module.exports = getOtherEmotes;
