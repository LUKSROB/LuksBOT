// Event handler for interaction creation

// Import necessary modules
const { upsertUser } = require('../../db/userHelper.js');

// Export the interaction create event handler
module.exports = async (interaction) => {

    const client = interaction.client;

    if (interaction.isChatInputCommand()) {
        const command = typeof client.getCommand === 'function'
        ? client.getCommand(interaction.commandName)
        : null;

        if (!command) {
            return;
        }

        try {
            const userDataPromise = upsertUser(
                interaction.user.id,
                interaction.user.username,
                interaction.guildId
            ).then((result) => result.user);
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