// would using tmi.js be better? 
// comfyjs lets us split things out into different events but they all ultimately come through as a message
// i could and could get the RAW IRC messages, but would require me to create my own parser for each raw message type
// the only benefit I can think of is that it would allow me to get a little 
const ComfyJS = require("comfy.js");
const { logDebug, logInfo, logError } = require("../utils/logger");

let messages = [];

function initTwitchChat(io) {

    ComfyJS.Init(process.env.TWITCH_CHANNEL, );

    ComfyJS.onChat = async (user, message, flags, self, extra) => {
        logDebug(`Chat message from ${user}: ${message}, ${JSON.stringify(extra)}`);

        const postData = {
            user: user,
            message: message,
            extra: extra,
        };

        var newMessage = await sendMessage(postData);

        io.emit("newMessage", newMessage);
    };

    // ComfyJS treats any chatmessage prefixed with ! as a command, you could use this to setup a chatbot, but i just wanna render the message normally
    ComfyJS.onCommand = async (user, command, message, flags, extra) => {
        logDebug(`Command from ${user}: !${command} ${message}`);
        message = `!${command} ${message}`;

        const postData = {
            user: user,
            message: message,
            extra: extra,
        };

        const newMessage = await sendMessage(postData);

        io.emit("newMessage", newMessage);
    };

    ComfyJS.onMessageDeleted = (id, extra) => {
        logDebug(`Message deleted: ${id}`)

        messages = messages.filter((message) => message.id !== id);
        io.emit("messageDeleted", id);
    }

    ComfyJS.onBan = (user, extra) => {
        logDebug(`User Banned ${user}`)
        messages = messages.filter((message) => message.user !== user);
        io.emit("userCleared", user)
    }

    ComfyJS.onTimeout = (user, duration, extra) => {
        logDebug(`User Timeout ${user} for ${duration} seconds`)
        messages = messages.filter((message) => message.user !== user);
        io.emit("userCleared", user)
    }

    ComfyJS.onSub = async (user, message, subTierInfo, extra) => {
        logDebug(`User Subscribed ${user} at ${subTierInfo}: ${message}\nextra: ${JSON.stringify(extra)}`)
        notificationMsg = `${user} subscribed!!! <br>`
        const postData = {
            user: user,
            message: message,
            extra: extra,
        };

        const newMessage = await sendMessage(postData, notificationMsg);

        io.emit("newMessage", newMessage);
    };

    ComfyJS.onResub = async (user, message, streamMonths, cumulativeMonths, subTierInfo, extra) => {
        logDebug(`Resubscribed ${user} for ${streamMonths}: ${message}\nextra: ${JSON.stringify(extra)}`);
        notificationMsg = `${user} resubscribed for ${cumulativeMonths} months !!!! <br>`
    
        // Construct the extra object with a default userState because i guess it just isnt there i hate this api
        const extraData = {
            userState: {
                "message-type": "resub", // Set a default message type
                "msg-id": "resub", // Add a default msg-id
            },
            messageEmotes: extra?.messageEmotes || null,
            id: extra?.id || null,
            channel: extra?.channel || process.env.TWITCH_CHANNEL,
            username: extra?.username || user, // Use the username for pronouns and profile picture
        };
    
        const postData = {
            user: user,
            message: message,
            extra: extraData,
        };
    
        const newMessage = await sendMessage(postData, notificationMsg);
    
        io.emit("newMessage", newMessage);
    };

    ComfyJS.onSubGift = async ( gifterUser, streakMonths, recipientUser, senderCount, subTierInfo, extra ) => {
        logDebug(`Gifted sub from ${gifterUser} to ${recipientUser} for ${streakMonths} months\nextra: ${JSON.stringify(extra)}`)
        const notificationMsg = `${gifterUser} gifted a sub to ${recipientUser}!`
        message = null
        const postData = {
            user: gifterUser,
            message: null,
            extra: extra,
        };

        const newMessage = await sendMessage(postData, notificationMsg);

        io.emit("newMessage", newMessage);
    }

    ComfyJS.onSubMysteryGift = async ( gifterUser, numbOfSubs, senderCount, subTierInfo, extra ) => {
        logDebug(`Gifted ${numbOfSubs} subs from ${gifterUser}\nextra: ${JSON.stringify(extra)}`)
        const notificationMsg = `${gifterUser} gifted ${numbOfSubs} subs!`
        const postData = {
            user: gifterUser,
            message: null,
            extra: extra,
        };

        const newMessage = await sendMessage(postData, notificationMsg);

        io.emit("newMessage", newMessage);
    }

    ComfyJS.onGiftSubContinue = async ( user, sender, extra ) => {
        logDebug(`${user} continued their gift sub from ${sender} \nextra: ${JSON.stringify(extra)}`)
        const notificationMsg = `${user} continued their gift sub from ${sender}!`
        const postData = {
            user: gifterUser,
            message: null,
            extra: extra,
        };

        const newMessage = await sendMessage(postData, notificationMsg);

        io.emit("newMessage", newMessage);
    }

    ComfyJS.onRaid = async (user, viewers, extra) => {
        logDebug(`Raid from ${user} with ${viewers} viewers\nextra: ${JSON.stringify(extra)}`)
        const notificationMsg = `${user} Raided with ${viewers} viewers!`
        // onRaid.extra only contains channel name, so we need to add the userState manually
        const extraData = {
            userState: {
                "message-type": "raid",
            },
            messageEmotes: null,
            id: null,
            channel: extra?.channel || process.env.TWITCH_CHANNEL,
            // user here returns the Display Name, not the username.
            // Unfortunately if the username != displayname, we can't get the pronouns or profile picture
            // i dont know a way around this if I want to fetch pfp and pronouns for this event
            username: user,
        }
        const postData = {
            user: user,
            message: null,
            extra: extraData,
        }
        const newMessage = await sendMessage(postData, notificationMsg);

        io.emit("newMessage", newMessage);
    }

    ComfyJS.onCheer = async ( user, message, bits, flags, extra ) => {
        logDebug(`Cheer from ${user}: ${message} with ${bits} bits\nextra: ${JSON.stringify(extra)}`)
        // is there a way to get the cheer emotes? Maybe map the string to the emotes?
        notificationMsg = `${user} cheered ${bits} bits!<br>`
        const postData = {
            user: user,
            message: message,
            extra: extra,
        };

        const newMessage = await sendMessage(postData, notificationMsg);

        io.emit("newMessage", newMessage);
    }

    logDebug("Twitch chat initialized.");
}

function getMessages() {
    return messages;
}

async function sendMessage(postData, notificationMsg) {
    logDebug(`Sending message: ${JSON.stringify(postData)}`);

    if (notificationMsg === null || notificationMsg === undefined) {
        notificationMsg = ""
    }
    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(postData),
        });
        const responseData = await response.json();
        logDebug(`Response: ${JSON.stringify(responseData)}`);

        message = notificationMsg + responseData.message;

        const newMessage = {
            user: postData.user,
            text: message,
            pronoun: responseData.pronoun || "unknown",
            id: responseData.id,
            badge: responseData.badge || "user",
            profile_image_url: responseData.profilePicture,
        };
        logDebug(`Sending Message to twitch: ${JSON.stringify(newMessage)}`);

        messages.push(newMessage);

        if (messages.length > 50) {
            messages.shift();
        }

        logDebug(`-----------------------------------------`);

        return newMessage;
    } catch (error) {
        logError(`Error sending chat message to server: ${error}`);
    }
}    


module.exports = {
    initTwitchChat,
    getMessages,
};