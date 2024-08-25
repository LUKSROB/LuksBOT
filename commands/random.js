// Randomize number between 0 and 2

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Randomize messages to be sent to the user'),
        
    execute: async (interaction) => {

        const random = Math.floor(Math.random() * 3);

        interaction
            .reply(`Random number: ${random}`)
            .catch(console.error);
    }
}