// Randomize number between 0 and 3

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll a dice'),
        
    execute: async (interaction) => {

        const diceValue = Math.floor(Math.random() * 6);
    

        interaction
            .reply(`🎲 ${diceValue + 1}`)
            .catch(console.error);
    }
}