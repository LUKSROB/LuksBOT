// Event handler for interaction creation

// Import necessary modules
const { upsertUser } = require('../../db/userHelper.js');
const { MessageFlags } = require('discord.js');

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

    } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
        try {
            const execute = typeof client.getInteractionHandler === 'function'
                ? client.getInteractionHandler(interaction.customId)
                : null;

            if (!execute) {
                console.warn(`[interactionCreate] No interaction handler found for customId "${interaction.customId}"`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'Esa interacción no está disponible o expiró.',
                        flags: MessageFlags.Ephemeral
                    });
                }
                return;
            }

            await execute(interaction);
        } catch (error) {
            console.error(error);
        }
    }

};