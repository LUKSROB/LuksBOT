// Event handler for interaction creation

// Import necessary modules
const { getUser } = require('../../db/userHelper.js');
const { incCmdCount } = require('../../db/incCmdCount.js');

// Export the interaction handler
module.exports = async (interaction) => {

    const client = interaction.client;

    // Chat input command handling
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            return;
        }

        try {
            const userDataPromise = getUser(interaction.user);
            const needsUserData = typeof command.execute === 'function' && command.execute.length >= 2;
            const userData = needsUserData ? await userDataPromise : undefined;

            await command.execute(interaction, userData);
            await userDataPromise;

            await incCmdCount(interaction.user);
        } catch (error) {
            console.error(error);
        }

    } else if (interaction.isButton()) {
        try {
            if (interaction.customId && interaction.customId.startsWith('tictactoe:')) {
                const execute = require('../../interactions/tictactoe.js');
                await execute(interaction);
            } else {
                const execute = require(`../../interactions/${interaction.customId}.js`);
                await execute(interaction);
            }
        } catch (error) {
            console.error(error);
        }
    }
};