


const { SlashCommandBuilder } = require('discord.js');
const { volume } = require('../../utils/functions/music');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Ajusta el volumen de la música.')
        .addNumberOption(option =>
            option.setName('nivel')
                .setDescription('El nivel de volumen (0-100)')
                .setRequired(true)
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
                    { name: '100', value: 100 }
                )
            ),
    execute: async (interaction) => {

        const player = interaction.client.riffy.players.get(interaction.guild.id);

        await interaction.deferReply();

        if (!player || !player.playing) {
            return await interaction.editReply({ content: '❌ No hay música reproduciéndose.', flags: 64 });

        }

        const volumeLevel = interaction.options.getNumber('nivel');

        await volume(interaction, player, volumeLevel);
    }
}
