const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday_date')
        .setDescription('Charge the birthday date of a user')
        .addStringOption(option => 
            option.setName('date')
                  .setDescription('Birthday date of the user')
                  .setMinLength(1)
                  .setMaxLength(100)
                  .setRequired(true)
        ),
        
    execute: async (interaction) => {
        const args = interaction.options.getString('date');
        console.log(interaction.user);
        

        interaction
            .reply(args)
            .catch(console.error);
    }
}