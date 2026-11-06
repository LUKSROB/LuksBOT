// Command resume: Resume the current song

// Import necessary modules
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { resume } = require('../../utils/functions/music');

// Export the resume command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Reanuda la pista actual'),
    // Execute the command when invoked
    execute: async (interaction) => {
        const { guild, client } = interaction;

        let player = client.riffy.players.get(guild.id);

        await interaction.deferReply();

        try {
            if (!player || !guild.members.me.voice.channel) {
                return await interaction.editReply({ content: 'No estoy reproduciendo nada actualmente.', flags: MessageFlags.Ephemeral });
            }

            await resume(interaction, player);

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ ¡Error al reanudar la música!', flags: MessageFlags.Ephemeral });
        }

    }
}