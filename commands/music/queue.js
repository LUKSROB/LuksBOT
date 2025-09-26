// Command queue: Display the current music queue

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../utils/functions/music');

// Export the queue command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Muestra la cola de reproducción actual'),
    // Execute the command
    execute: async (interaction) => {
        const { guild, client } = interaction;
        
        let player = client.riffy.players.get(guild.id);

        interaction.deferReply();

        try {
            
            await queue(interaction, player);

        } catch (error) {

            console.error(error);
            interaction.editReply({ content: 'Error al mostrar la cola de reproducción ❌', flags: 64 });
        }

    }
}