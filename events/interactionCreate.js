// Handler interactions for the bot

const { getOrCreateUser, incrementCommandCount } = require('../db/userHelper');

module.exports = async (interaction) => {
    const client = interaction.client;

    const command = client.commands.get(interaction.commandName);

  
    if (interaction.isChatInputCommand()) {
        try {
            const userData = await getOrCreateUser(interaction.user.id, interaction.guild.id);
            command.execute(interaction, userData);
            
            await incrementCommandCount(interaction.user.id, interaction.guild.id);
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