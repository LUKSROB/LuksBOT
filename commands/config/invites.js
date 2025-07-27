// Command invites: Manages server invites

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInvites } = require('../../db/invites');

// Export the invites command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Gestiona las invitaciones del servidor'),
    // Execute the command
    execute: async (interaction) =>{
        const guild = interaction.guild;
        const invites = await getInvites(guild.id);

        const inviteCount = {};
        
        invites.forEach((invite) => {
            if (!invite.inviter) return;
            
            let name = invite.inviter.username;

            inviteCount[name] = ( inviteCount[name] || 0 ) + invite.uses;
        });

        const sortedInvites = Object.keys(inviteCount).sort(
            (a, b) => inviteCount[b] - inviteCount[a]
        ).slice(0, 10);

        const description = sortedInvites
            .map(invite => `**${invite}** ha invitado a **${inviteCount[invite]}** miembro(s)`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('Top Invitadores del Servidor')
            .setDescription(description)
            .setColor('#fbd9ff');

        await interaction.reply({ embeds: [embed] });
    }
};