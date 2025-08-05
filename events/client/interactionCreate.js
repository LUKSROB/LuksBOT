// Event handler for interaction creation

// Import necessary modules
const { getUser } = require('../../db/userHelper.js');
const { incCmdCount } = require('../../db/incCmdCount.js');

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

    } else if (interaction.isButton()) {
        try {
            if (interaction.customId && interaction.customId.startsWith('tictactoe:')) {
                const execute = require('../../interactions/tictactoe.js');
                execute(interaction);
            } else {
                const execute = require(`../../interactions/${interaction.customId}.js`);
                execute(interaction);
            }
        } catch (error) {
            console.error(error);
        }
    }
};