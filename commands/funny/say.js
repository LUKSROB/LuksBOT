// Command say: Repeats a message provided by the user

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');

// Export the say command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Repeat a argument that you provide')
        .addStringOption(option => 
            option.setName('message')
                  .setDescription('Message to repeat')
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