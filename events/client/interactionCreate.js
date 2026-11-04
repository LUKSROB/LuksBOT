// Event handler for interaction creation

// Import necessary modules
const { getUser } = require('../../db/userHelper.js');
const { incCmdCount } = require('../../db/incCmdCount.js');

// Export the interaction handler
module.exports = async (interaction) => {

    const client = interaction.client;

    // Chat input command handling
    if (interaction.isChatInputCommand()) {
        // Obtener el comando (compatible con sistema híbrido)
        const command = typeof client.getCommand === 'function'
        ? client.getCommand(interaction.commandName)
        : null;

        if (!command) {
            return;
        }

        try {
            await incCmdCount(interaction.user.id, interaction.user.username, interaction.guildId);
            const userDataPromise = getUser(interaction.user.id, interaction.user.username, interaction.guildId);
            const needsUserData = typeof command.execute === 'function' && command.execute.length >= 2;
            const userData = needsUserData ? await userDataPromise : undefined;

            
            await command.execute(interaction, userData);
            await userDataPromise;
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
        
    } else if (interaction.isStringSelectMenu()) {
        try {
            const execute = require(`../../interactions/${interaction.customId}.js`);
            await execute(interaction);
        } catch (error) {
            console.error(error);
        }
    }
};