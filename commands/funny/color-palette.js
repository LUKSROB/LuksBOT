// Command Color-Palette: Get the color palette from an image URL or attachment

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getPaletteColor, rgbToHex } = require('../../utils/functions/colors');
const { generateColorImage } = require('../../utils/canvas/colorImage');

// Export the color palette command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('color-palette')
        .setDescription('Obtiene la paleta de colores de una imagen')
        .addNumberOption(option =>
            option.setName('colors')
                .setDescription('Número de colores en la paleta (1-10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)
        )
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL de la imagen')
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Sube una imagen')
                .setRequired(false)
        ),
    // Execute the command
    execute: async (interaction) => {
        const url = interaction.options.getString('url');
        const image = interaction.options.getAttachment('image');
        const colorCount = interaction.options.getNumber('colors');

        if (!url && !image) {
            return await interaction.reply('Debes proporcionar una URL o subir una imagen.', { flags: 64 });
        }

        await interaction.deferReply();

        try {
            const colorData = await getPaletteColor(url || image, colorCount);
            const palette = colorData.map(color => rgbToHex(color.r, color.g, color.b));
            const colorImage =  generateColorImage(palette, palette.length);
            const attachments = new AttachmentBuilder(colorImage, { name: 'color.png' });

            const embed = new EmbedBuilder()
                .setTitle('Paleta de Colores')
                .setDescription(`La paleta de colores de la imagen es:\n${palette.join('\n')}`)
                .setThumbnail('attachment://color.png')
                .setColor(palette[Math.floor(Math.random() * (palette.length / 2))]);

            await interaction.editReply({ embeds: [embed], files: [attachments] });
        } catch (error) {
            console.log(error);
            await interaction.editReply({ content: error.message, flags: 64 });
        }
        
    }
};