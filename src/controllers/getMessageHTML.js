const { logDebug, logInfo, logError } = require('../utils/logger');
const sanitizeHtml = require('sanitize-html');
const {EmoteFetcher, EmoteParser} = require('@mkody/twitch-emoticons');
const getOtherEmotes = require('./getOtherEmotes');

// handles multi-byte characters like some emojis such as 🇦
const GraphemeSplitter = require('grapheme-splitter');
const splitter = new GraphemeSplitter();

const allowedTags = process.env.ALLOWED_HTML_TAGS_LIST
    ? process.env.ALLOWED_HTML_TAGS_LIST.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
    : [];

function getTwitchEmotes(message, userState, emotes) {
    logDebug(`getTwitchEmotes called with \nmessage: ${message} \nuserState: ${JSON.stringify(userState)} \nemotes: ${JSON.stringify(emotes)}`);

    if (message === null || message === undefined) return "";
    if (!emotes || typeof emotes !== 'object') return message;

    const graphemes = splitter.splitGraphemes(message);
    const processedGraphemes = graphemes.flatMap(splitRegionalIndicators);

    const msgId = userState?.['msg-id'] || null;
    const replacementSize = msgId === 'gigantified-emote-message' ? '4.0' : '2.0';

    const stringReplacements = [];

    Object.entries(emotes).forEach(([id, positions]) => {
        if (!Array.isArray(positions) || positions.length === 0) return;

        positions.forEach((position) => {
            const [start, end] = position.split("-");
            if (isNaN(start) || isNaN(end)) return;

            const stringToReplace = processedGraphemes.slice(parseInt(start, 10), parseInt(end, 10) + 1).join('');

            stringReplacements.push({
                stringToReplace: stringToReplace,
                replacement: `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/${replacementSize}" />`,
                start: parseInt(start, 10),
            });
        });
    });

    stringReplacements.sort((i, j) => i.start - j.start);

    stringReplacements.forEach(({ stringToReplace, replacement }) => {
        const escapedStringToReplace = stringToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
        const regex = new RegExp(`\\b${escapedStringToReplace}\\b`, 'g'); // Match whole words only
        message = message.replace(regex, replacement);
    });

    return message;
}

function sanitizeMessage(message) {
    logDebug(`message after emote replacement: ${message}`);
    const messageHTML = sanitizeHtml(message, {
        // allowed tags are allowedTags plus <img>);
        // <img> is added to the list of allowed tags in the transformTags function
        allowedTags: [...allowedTags, 'img'],
        transformTags: {
            img: (tagName, attribs) => {
                if (attribs.src && attribs.src.startsWith('https://static-cdn.jtvnw.net/emoticons/v2/')) {
                    return {
                        tagName: 'img',
                        attribs: {
                            src: attribs.src
                        },
                    };
                }
                // otherwise do not allow the image tag
                // span is useless, idk if there's a way to just remove the tag all together or have it escaped like other disallowed tags
                // because we're silly and maybe allowing some tags we have to sanitize after 
                return {
                    tagName: 'span',
                    attribs: {
                        class: 'error',
                    },
                };
            },
        },
        textFilter: (text) => {
            return text;
        },
        disallowedTagsMode: 'escape',
    });

    return messageHTML;
}

async function getMessageHTML(message, userState, emotes) {
    logDebug(`getMessageHTML called with \nmessage: ${message} \nuserState: ${JSON.stringify(userState)} \nemotes: ${JSON.stringify(emotes)}`);

    if (!message) return '';

    // replace emotes in message with HTML
    message = getTwitchEmotes(message, userState, emotes);
    logDebug(`message after emote replacement: ${message}`);

    // sanitize message to remove any HTML tags not in allowedTags
    // yea i could just disallow everything and this would be a lot easier
    // but i thought it would be funny to allow some things
    // if I decide 
    message = sanitizeMessage(message);
    logDebug(`message after sanitization: ${message}`);


    message = await getOtherEmotes(message);

    return message;
}

// 🇦🇨 (double regional characters) take up multiple bytes but twitch renders them as two characters instead of one for the emote parser
// this function splits them into two separate characters
function splitRegionalIndicators(message) {
    // these are the regional indicator characters
    // https://symbl.cc/en/emoji/flags/country-flag/
    const regionalIndicatorRegex = /[\uD83C][\uDDE6-\uDDFF]/g;
    const result = [];
    let lastIndex = 0;

    message.replace(regionalIndicatorRegex, (match, offset) => {
        if (offset > lastIndex) {
            result.push(message.slice(lastIndex, offset));
        }
        result.push(match);
        lastIndex = offset + match.length;
    });

    if (lastIndex < message.length) {
        result.push(message.slice(lastIndex));
    }

    return result;
}

module.exports = getMessageHTML;
