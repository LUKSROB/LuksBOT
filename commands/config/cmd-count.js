// Command cmd-count: Shows the number of commands used by the user

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');
const { getUser } = require('../../db/userHelper');

// Export the cmdCount command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('cmd-count')
        .setDescription('Muestra la cantidad de comandos utilizados por el usuario')
        .addUserOption(option =>
            option.setName('user')
                  .setDescription('Usuario del que mostrar la cantidad de comandos utilizados')
                  .setRequired(false)
        ),
    // Execute the command when invoked
    execute: async (interaction, userData) => {
        const target = interaction.options.getUser('user');

        let targetData;
        let message;
        if (target && target.id !== interaction.user.id) {

            targetData = await getUser(target.id, target.username, interaction.guild.id);
            message = `${target.username} ha utilizado un total de ${targetData.commandCount == undefined ? 0 : targetData.commandCount} comandos.`;
        } else {
            message = `¡Hola ${interaction.user.username}! tienes un total de ${userData.commandCount == undefined ? 0 : userData.commandCount} comandos utilizados.`;
        }

        await interaction.reply(message);
    },
}