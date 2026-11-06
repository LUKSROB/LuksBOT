// Interaction handler for rolling a dice

// Import necessary modules
const { getRandomInt } = require('../utils/functions/math');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const rollButton = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('roll')
            .setLabel('🎲 Roll')
            .setStyle('Primary')
    );
// Export the interaction handler for rolling a dice
module.exports = async (interaction) => {

    const diceValue = getRandomInt(1, 6);
    await interaction.update({ content: `🎲 ${diceValue}`, components: [ rollButton ] });

};