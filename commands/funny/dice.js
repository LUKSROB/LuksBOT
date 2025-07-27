// Command dice: Rolls a dice and returns a random number between 1 and 6

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');

// Export the dice command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll a dice'),
    // Execute the command
    execute: async (interaction) => {

        const diceValue = Math.floor(Math.random() * 6);

        interaction
            .reply(`🎲 ${diceValue + 1}`)
            .catch(console.error);
    }
}