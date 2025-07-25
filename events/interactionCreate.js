// Handler interactions for the bot

// Import necessary modules
const { getUser } = require('../db/userHelper');
const { incCmdCount } = require('../db/incCmdCount');

// Export the interaction handler
module.exports = async (interaction) => {
    const client = interaction.client;

    const command = client.commands.get(interaction.commandName);

    // Chat input command handling
    if (interaction.isChatInputCommand()) {
        try {
            const userData = await getUser(interaction.user.id);
            command.execute(interaction, userData);

            await incCmdCount(interaction.user.id);
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