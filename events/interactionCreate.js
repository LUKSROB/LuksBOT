// Handler interactions for the bot

const { getUser, incCmdCount } = require('../db/userHelper');

module.exports = async (interaction) => {
    const client = interaction.client;

    const command = client.commands.get(interaction.commandName);

  
    if (interaction.isChatInputCommand()) {
        try {
            const userData = await getUser(interaction.guild.id, interaction.user.id);
            command.execute(interaction, userData);

            await incCmdCount(interaction.guild.id, interaction.user.id);
        } catch (error) {
            console.error(error);
        }
    } else {
        try {
            const execute = require(`../interactions/${interaction.customId}.js`);
            execute(interaction);
        } catch (error) {
            console.error(error);
        }
    }
};