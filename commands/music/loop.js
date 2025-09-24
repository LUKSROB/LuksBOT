// Command loop: Loop the current song or playlist

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');
const { loop } = require('../../utils/functions/music');

// Export the loop command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Reproduce la canción o la lista de reproducción en un bucle')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Selecciona el modo de bucle')
                .setChoices(
                    { name: 'Canción', value: 'track' },
                    { name: 'Lista de reproducción', value: 'queue' },
                    { name: 'Desactivar', value: 'none' }
                )
        ),
    // Execute the command
    execute: async (interaction) => {
        const { guild, client } = interaction;
        const mode = interaction.options.getString('mode')
        
        let player = client.riffy.players.get(guild.id);

        try {
            
            loop(interaction, player, mode );

        } catch (error) {

            console.error(error);
            interaction.reply({ content: 'Error al cambiar el estado de bucle ❌', flags: 64 });
        }

    }
}