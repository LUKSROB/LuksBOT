const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Repeat a argument that you provide'),
        
    run: async (message) => {
        const args = message.content.split(' ').slice(1).join(' ');

        if (args.length < 1) return message.reply('You need to provide a message to say');
        
        message.reply(args);
    }
}