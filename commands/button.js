const { ButtonBuilder, ActionRowBuilder, SlashCommandBuilder } = require('discord.js');

const usernameButton = new ButtonBuilder()
    .setCustomId('username')
    .setEmoji('👤')
    .setLabel('Mostrar nombre de usuario')
    .setStyle(1);

const avatarButton = new ButtonBuilder()
    .setCustomId('avatar')
    .setEmoji('🖼️')
    .setLabel('Mostrar avatar de usuario')
    .setStyle(1);

const contactButton = new ButtonBuilder()
    .setCustomId('contact')
    .setEmoji('📞')
    .setLabel('Contactar')
    .setStyle(2);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('button')
        .setDescription('Send two buttons, username and avatar'),

    execute: async (interaction) => {
        const actionRow = new ActionRowBuilder().addComponents(usernameButton, avatarButton);

        const reply = await interaction.reply({
            components: [actionRow]
        });

        const collector = interaction.channel.createMessageComponentCollector({
            time: 60 * 1000
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'username') {
                interaction.update({
                    content: `Tu nombre es ${interaction.user.displayName}`,
                    components: []
                });
            } else if (interaction.customId === 'avatar') {
                const avatar = interaction.user.displayAvatarURL({ size: 512 });

                interaction.update({
                    content: 'Tu imagen de perfil es:',
                    files: [avatar],
                    components: []
                });
            }
        });

        collector.on('end', async () => {
            reply.edit({ components: [] }).catch(console.error);
        });
    }
}