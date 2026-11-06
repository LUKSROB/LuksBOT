// Command dice: Rolls a dice and returns a random number between 1 and 6

// Import necessary modules
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getRandomInt } = require('../../utils/functions/math');

// Export the dice command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Lanza un dado'),
    // Execute the command when invoked
    execute: async (interaction) => {

        const rollButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('roll')
                    .setLabel('🎲 Roll')
                    .setStyle('Primary')
            );

        const diceValue = getRandomInt(1, 6);

        interaction
            .reply({ content: `🎲 ${diceValue}`, components: [rollButton] })
            .catch(console.error);
    }
}