const { queue } = require('../utils/functions/music');

module.exports = async (interaction) => {
    const { guild, client } = interaction;

    let player = client.riffy.players.get(guild.id);

    interaction.deferReply();

    await queue(interaction, player);

}