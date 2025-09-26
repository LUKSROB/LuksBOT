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
        )
        .addNumberOption(option =>
            option.setName('volume')
                .setDescription('Nivel de volumen (0-100)')
                .setRequired(false)
                .setChoices(
                    { name: '10', value: 10 },
                    { name: '20', value: 20 },
                    { name: '30', value: 30 },
                    { name: '40', value: 40 },
                    { name: '50', value: 50 },
                    { name: '60', value: 60 },
                    { name: '70', value: 70 },
                    { name: '80', value: 80 },
                    { name: '90', value: 90 },
                    { name: '100', value: 100 },
                )
        ),
    // Execute the command
    execute: async ( interaction ) => {
        const { member, guild, client } = interaction;

        let player = client.riffy.players.get(guild.id);
        
        await interaction.deferReply();

        if (!member.voice.channel) {
            return await interaction.editReply('¡Debes estar en un canal de voz!', { flags: 64 });
        } else if (guild.members.me.voice.channel && !guild.members.me.voice.channel.equals(member.voice.channel)) {
            const invite = await guild.members.me.voice.channel.createInvite({
                maxAge: 300,
                maxUses: 5,
                unique: true
            });
            return await interaction.editReply(`Debes estar en mi mismo canal de voz que yo\nAhora estoy reproduciendo en <#${guild.members.me.voice.channel.id}>\n¡Unete! ${invite.url}`, { flags: 64 });
        }

        await play(interaction, player);
    }
};