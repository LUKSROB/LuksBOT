// Command skip: Skip the current playing track

// Import necessary modules
const { SlashCommandBuilder } = require("discord.js");
const { skip } = require("../../utils/functions/music");

// Export the skip command module
module.exports = {
    // Define the command structure
	data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip the current playing track"),
    // Execute the command
    execute: async ( interaction ) => {

        const { client } = interaction;

        const player = client.riffy.players.get(interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: "No estoy reproduciendo nada actualmente.", flags: 64 });
        }

        if (player.queue.size === 0) {
            return interaction.reply({ content: "La cola está vacía.", flags: 64 });
        };

        skip(interaction, player);

    }
};