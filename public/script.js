
const socket = io();

socket.on("newMessage", (message) => {
    const messagesList = document.getElementById("messages");

    // Create a div element instead of li to match the EJS structure
    const newMessage = document.createElement("div");
    newMessage.classList.add(message.badge);
    newMessage.classList.add(message.user);
    newMessage.id = message.id;

    newMessage.innerHTML = `
                <a class="pfp">
                    <img src="${message.profile_image_url}">
                </a>
                <a class="name ${message.pronoun}">${message.user}</a>
                <div class="text">${message.text}</div>
            `;

    // Add a class to trigger the animation
    newMessage.classList.add('new-message');

    messagesList.appendChild(newMessage);

    // Remove the animation class after animation completes to allow re-triggering
    setTimeout(() => {
        newMessage.classList.remove('new-message');
    }, 500);
});

socket.on("messageDeleted", (messageId) => {

    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.remove();
    } else {
        console.error(`Message with ID ${messageId} not found.`);
    }
});

// this event is used when the user is banned or time out from the chat to clear all messages sent by them

socket.on("userCleared", (user) => {
    const messagesList = document.getElementById("messages");
    const userMessages = messagesList.querySelectorAll(`.${user}`);
    userMessages.forEach((message) => {
        message.remove();
    });
})