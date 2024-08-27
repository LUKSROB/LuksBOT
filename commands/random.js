// Randomize number between 0 and 3

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Randomize messages to be sent to the user'),
        
    execute: async (interaction) => {

        const random = Math.floor(Math.random() * 3);
        const welcomeMessage = [
            'Welcome to the server!',
            'We are glad to have you here!',
            'Welcome to the community!'
        ];
    

        interaction
            .reply(welcomeMessage[random])
            .catch(console.error);
    }
}