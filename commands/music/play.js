// Command play: Play a song

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');
const { play } = require('../../utils/functions/music');

// Export the ping command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce una canción o agregala a la cola')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nombre o URL de la canción')
                .setRequired(true)
        ),
    // Execute the command
    execute: async ( interaction ) => {
        const { member, guild, client } = interaction;

        let player = client.riffy.players.get(guild.id);
        
        interaction.deferReply();

        if (!member.voice.channel) {
            return interaction.editReply('¡Debes estar en un canal de voz!', { flags: 64 });
        } else if (guild.members.me.voice.channel && !guild.members.me.voice.channel.equals(member.voice.channel)) {
            const invite = await guild.members.me.voice.channel.createInvite({
                maxAge: 300,
                maxUses: 5,
                unique: true
            });
            return  interaction.editReply(`Debes estar en mi mismo canal de voz que yo\nAhora estoy reproduciendo en <#${guild.members.me.voice.channel.id}>\n¡Unete! ${invite.url}`, { flags: 64 });
        }

        await play(interaction, player);
    }
};