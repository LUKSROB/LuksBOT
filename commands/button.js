const { ButtonBuilder, ActionRowBuilder, SlashCommandBuilder } = require('discord.js');

const usernameButton = new ButtonBuilder()
    .setCustomId('username')
    .setEmoji('✅')
    .setLabel('Mostrar nombre de usuario')
    .setStyle(1);

const avatarButton = new ButtonBuilder()
    .setCustomId('avatar')
    .setEmoji('☺️')
    .setLabel('Mostrar avatar de usuario')
    .setStyle(2);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('button')
        .setDescription('Envia dos botones, uno envia el user '),

    run: async (message) => {
        const actionRow = new ActionRowBuilder().addComponents(usernameButton, avatarButton);

        const reply = await message.reply({
            components: [actionRow]
        });

        const filter = (interaction) => interaction.user.id === message.author.id && interaction.message.id === reply.id;
        const collector = message.channel.createMessageComponentCollector({
            filter, time: 60 * 1000
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'username') {
                interaction.update({
                    content: `Tu nombre es ${message.author.displayName}`,
                    components: []
                });
            } else if (interaction.customId === 'avatar') {
                const avatar = message.author.displayAvatarURL({ size: 512 });

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