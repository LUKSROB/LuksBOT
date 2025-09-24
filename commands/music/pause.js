// Command pause: Pause the current song

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');
const { pause } = require('../../utils/functions/music');

// Export the pause command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current track'),
    // Execute the command
    execute: async (interaction) => {
        const { guild, client } = interaction;
        
        let player = client.riffy.players.get(guild.id);

        try {
            if (!player || !guild.members.me.voice.channel) {
                return interaction.reply({ content: 'No estoy reproduciendo nada actualmente.', flags: 64 });
            }
            pause(player);

        } catch (error) {

            console.error(error);
            interaction.reply({ content: 'Error al pausar/reanudar la música ❌', flags: 64 });
        }

    }
}