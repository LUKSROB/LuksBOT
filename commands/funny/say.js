// Command say: Repeats a message provided by the user

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');

// Export the say command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Repite un mensaje proporcionado por el usuario')
        .addStringOption(option => 
            option.setName('message')
                  .setDescription('Mensaje a repetir')
                  .setMinLength(1)
                  .setMaxLength(100)
                  .setRequired(true)
        ),
    // Execute the command
    execute: async (interaction) => {
        const args = interaction.options.getString('message');

        interaction
            .reply(args)
            .catch(console.error);
    }
}