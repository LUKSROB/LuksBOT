// Command translate: Translate text using DeepL API

// Import necessary modules
const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { COLORS } = require('../../../config.json');

// Export the translate command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Traduce texto a otro idioma')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Texto a traducir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('target_language')
                .setDescription('Código del idioma de destino (por ejemplo, "es" para español)')
                .setRequired(true)
                .setChoices(
                    {name: 'Arabe', value: 'ar'}, //AR - Arabic
                    {name: 'Búlgaro', value: 'bg'}, //BG - Bulgarian
                    {name: 'Checo', value: 'cs'}, //CS - Czech
                    {name: 'Danés', value: 'da'}, //DA - Danish
                    {name: 'Alemán', value: 'de'}, //DE - German
                    {name: 'Griego', value: 'el'}, //EL - Greek
                    {name: 'Inglés (Británico)', value: 'en-GB'}, //EN-GB - English (British)
                    {name: 'Inglés (Americano)', value: 'en-US'}, //EN-US - English (American)
                    {name: 'Español', value: 'es'}, //ES - Spanish
                    {name: 'Finlandés', value: 'fi'}, //FI - Finnish
                    {name: 'Francés', value: 'fr'}, //FR - French
                    {name: 'Indonesio', value: 'id'}, //ID - Indonesian
                    {name: 'Italiano', value: 'it'}, //IT - Italian
                    {name: 'Japonés', value: 'ja'}, //JA - Japanese
                    {name: 'Coreano', value: 'ko'}, //KO - Korean
                    {name: 'Noruego (Bokmål)', value: 'nb'}, //NB - Norwegian Bokmål
                    {name: 'Neerlandés', value: 'nl'}, //NL - Dutch
                    {name: 'Polaco', value: 'pl'}, //PL - Polish
                    {name: 'Portugués (Brasileño)', value: 'pt-BR'}, //PT-BR - Portuguese (Brazilian)
                    {name: 'Portugués (Europeo)', value: 'pt-PT'}, //PT-PT - Portuguese (European)
                    {name: 'Ruso', value: 'ru'}, //RU - Russian
                    {name: 'Sueco', value: 'sv'}, //SV - Swedish
                    {name: 'Turco', value: 'tr'}, //TR - Turkish
                    {name: 'Ucraniano', value: 'uk'}, //UK - Ukrainian
                    {name: 'Chino', value: 'zh'}, //ZH - Chinese (unspecified variant for backward compatibility; please select ZH-HANS or ZH-HANT instead)
                )
        ),
    // Execute the command
    execute: async (interaction) => {
        const { options, client } = interaction;
        const text = options.getString('text');
        const targetLanguage = options.getString('target_language');

        try {
            const result = await client.translator.translateText(text, null, targetLanguage);
            const embed = new EmbedBuilder()
                .setColor(COLORS.PRIMARY)
                .setDescription(`**Texto Original:**\n${text}\n\n**Texto Traducido:**\n${result.text}`)
                .setFooter({
                    iconURL: interaction.user.displayAvatarURL(),
                    text: `Solicitado por: ${interaction.user.username} | Traducido a ${targetLanguage.toUpperCase()}`
                });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error al traducir el texto.', flags: MessageFlags.Ephemeral });
        }
    }
};
