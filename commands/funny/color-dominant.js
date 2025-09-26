// Command Color-Dominant: Get the dominant color from an image URL or attachment

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getDominantColor, rgbToHex, isDarkHex } = require('../../utils/functions/colors');
const { generateColorImage } = require('../../utils/canvas/colorImage');

// Export the color dominant command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('color-dominant')
        .setDescription('Obtiene el color dominante de una imagen')
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

        if (!url && !image) {
            return await interaction.reply('Debes proporcionar una URL o subir una imagen.', { flags: 64 });
        }

        await interaction.deferReply();

        try {
            const colorData = await getDominantColor(url || image);
            const { r, g, b } = colorData;

            const hexColor = rgbToHex(r, g, b);
            const isDark = await isDarkHex(hexColor);

            const colorImage = generateColorImage(hexColor);
            const attachment = new AttachmentBuilder(colorImage, { name: 'color.png' });

            const embed = new EmbedBuilder()
                .setTitle('Color Dominante')
                .setDescription(`El color dominante de la imagen es: ${hexColor}\n es oscuro: ${isDark}`)
                .setThumbnail('attachment://color.png')
                .setColor(hexColor);

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.log(error);
            await interaction.editReply({ content: error.message, flags: 64 });
        }
        
    }
};