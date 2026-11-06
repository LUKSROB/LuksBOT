// Interaction handler for displaying the music queue

// Import necessary modules
const { queue } = require('../utils/functions/music');

// Export the interaction handler for displaying the music queue
module.exports = async (interaction) => {

    const { guild, client } = interaction;

    let player = client.riffy.players.get(guild.id);

    await interaction.deferReply();

    await queue(interaction, player);

}