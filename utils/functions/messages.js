// Randomize messages to be sent to the user

const {  } = require("discord.js");

module.exports = async (interaction) => {
    const random = Math.random() * 3;

    interaction
        .reply(random)
        .catch(console.error);
}