// Randomize messages to be sent to the user

const {  } = require("discord.js");

module.exports = async (interaction) => {
    const random = Math.random() * 3;

    const welcomeMessage = [
        'Welcome to the server!',
        'We are glad to have you here!',
        'Welcome to the community!'
    ];

    interaction
        .reply(welcomeMessage[random])
        .catch(console.error);
}