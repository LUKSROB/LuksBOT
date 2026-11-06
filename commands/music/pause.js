// Command pause: Pause the current song

// Import necessary modules
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { pause } = require('../../utils/functions/music');

// Export the pause command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausa la pista actual'),
    // Execute the command when invoked
    execute: async (interaction) => {
        const { guild, client } = interaction;
        
        let player = client.riffy.players.get(guild.id);

        await interaction.deferReply();

        try {
            if (!player || !guild.members.me.voice.channel) {
                return await interaction.editReply({ content: 'No estoy reproduciendo nada actualmente.', flags: MessageFlags.Ephemeral });
            }
            await pause(player);

        } catch (error) {

            console.error(error);
            await interaction.editReply({ content: 'Error al pausar/reanudar la música ❌', flags: MessageFlags.Ephemeral });
        }

    }
}