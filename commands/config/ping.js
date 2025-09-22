// Command ping: Check the bot's latency

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');

// Export the command ping
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Verifica la latencia del bot'),
    // Execute the command
    execute: async (interaction) => {
        const sent = await interaction.reply({ content: 'Pinging...' });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        await interaction.editReply({
            content: `**Pong!**\n📡 **Latencia de la API:** ${apiLatency}ms\n⏱️ **Latencia del Bot:** ${latency}ms`
        });
    },
}