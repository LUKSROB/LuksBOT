// Command Color-Dominant: Get the brightness whit a color

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { brightnessHex, isRgb, rgbToHex, hexToRgb, validateHex, isVeryDarkHex, isDarkRgb} = require('../../utils/functions/colors');
const { generateColorImage } = require('../../utils/canvas/colorImage');

// Export the color dominant command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('color-brightness')
        .setDescription('Obtiene el brillo de un color')
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Color en formato hexadecimal, rgb o rgba')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Cantidad para ajustar el brillo')
                .min_value(1)
                .max_value(100)
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('is_dark')
                .setDescription('Indica si el color es muy oscuro')
                .setRequired(false)
        ),

    // Execute the command
    execute: async (interaction) => {
        const color = interaction.options.getString('color');
        const amount = interaction.options.getNumber('amount');
        const isDarkOption = interaction.options.getBoolean('is_dark');

        if (!color) {
            return await interaction.reply({ content: 'Debes proporcionar un color.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        try {
            let hexColor;
            let isDark;
            let isVeryDark;
            let brightness;

            const rgbMatch = isRgb(color);

            if (rgbMatch) {
                const r = parseInt(rgbMatch[1]);
                const g = parseInt(rgbMatch[2]);
                const b = parseInt(rgbMatch[3]);
                const validated = validateRgb(r, g, b);
                hexColor = rgbToHex(validated.r, validated.g, validated.b);
            } else {
                hexColor = `#${validateHex(color)}`;
            }

            if (isDarkOption == true) {
                
                isDark = isDarkHex(hexColor);
                isVeryDark = isVeryDarkHex(hexColor);
            }

            brightness = brightnessHex(hexColor, amount);

            const attachment = new AttachmentBuilder(brightness, { name: 'color.png' });

            const embed = new EmbedBuilder()
                .setTitle('Brillo del Color')
                .setDescription(`
                    El color **${hexColor}** \n
                    es: ${!isDark ? 'No muy oscuro' : isVeryDark ? 'Muy oscuro' : 'Oscuro'} \n
                    brillo ajustado: ${brightness}
                `)
                .setThumbnail(`attachment://color.png`)
                .setColor(brightness);

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.log(error);
            await interaction.editReply({ content: 'Ocurrió un error al procesar el color.', flags: MessageFlags.Ephemeral });
        }
        
    }
};