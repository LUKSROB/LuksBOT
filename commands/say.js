// Repeat a argument that you provide

const { SlashCommandBuilder } = require('discord.js');
const { execute } = require('./random');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Repeat a argument that you provide')
        .addStringOption(option => 
            option.setName('message')
                  .setDescription('Message to repeat')
                  .setMinLength(1)
                  .setMaxLength(100)
                  .setRequired(true)
        ),
        
    execute: async (interaction) => {
        const args = interaction.options.getString('message');

        interaction
            .reply(args)
            .catch(console.error);
    }
}