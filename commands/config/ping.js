// Command ping: Check the bot's latency

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');

// Export the command ping
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency.'),
    // Execute the command
    execute: async (interaction) => {
        const sent = await interaction.reply({ content: 'Pinging...' });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        await interaction.editReply({
            content: `**Pong!**\n📡 **API Latency:** ${apiLatency}ms\n⏱️ **Bot Latency:** ${latency}ms`
        });
    },
}