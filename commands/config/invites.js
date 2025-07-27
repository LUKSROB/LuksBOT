const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInvites } = require('../../db/invites');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Gestiona las invitaciones del servidor'),

    async execute(interaction) {
        const guild = interaction.guild;
        const invites = await getInvites(guild.id);

        const inviteCount = {};
        
        invites.forEach((invite) => {
            if (!invite.inviter) return;
            
            let name = invite.inviter.username;

            inviteCount[name] = ( inviteCount[name] || 0 ) + invite.uses;
            console.log(inviteCount[name]);
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