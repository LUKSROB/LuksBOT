// Command translate: Translate text using DeepL API

// Import necessary modules
const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');

// Export the translate command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text using DeepL API.')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to translate')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('target_language')
                .setDescription('Target language code (e.g., "es" for Spanish)')
                .setRequired(true)
                .setChoices(
                    {name: 'Arabic', value: 'ar'}, //AR - Arabic
                    {name: 'Bulgarian', value: 'bg'}, //BG - Bulgarian
                    {name: 'Czech', value: 'cs'}, //CS - Czech
                    {name: 'Danish', value: 'da'}, //DA - Danish
                    {name: 'German', value: 'de'}, //DE - German
                    {name: 'Greek', value: 'el'}, //EL - Greek
                    {name: 'English (British)', value: 'en-GB'}, //EN-GB - English (British)
                    {name: 'English (American)', value: 'en-US'}, //EN-US - English (American)
                    {name: 'Spanish', value: 'es'}, //ES - Spanish
                    {name: 'Finnish', value: 'fi'}, //FI - Finnish
                    {name: 'French', value: 'fr'}, //FR - French
                    {name: 'Indonesian', value: 'id'}, //ID - Indonesian
                    {name: 'Italian', value: 'it'}, //IT - Italian
                    {name: 'Japanese', value: 'ja'}, //JA - Japanese
                    {name: 'Korean', value: 'ko'}, //KO - Korean
                    {name: 'Norwegian Bokmål', value: 'nb'}, //NB - Norwegian Bokmål
                    {name: 'Dutch', value: 'nl'}, //NL - Dutch
                    {name: 'Polish', value: 'pl'}, //PL - Polish
                    {name: 'Portuguese (Brazilian)', value: 'pt-BR'}, //PT-BR - Portuguese (Brazilian)
                    {name: 'Portuguese (European)', value: 'pt-PT'}, //PT-PT - Portuguese (European)
                    {name: 'Russian', value: 'ru'}, //RU - Russian
                    {name: 'Swedish', value: 'sv'}, //SV - Swedish
                    {name: 'Turkish', value: 'tr'}, //TR - Turkish
                    {name: 'Ukrainian', value: 'uk'}, //UK - Ukrainian
                    {name: 'Chinese', value: 'zh'}, //ZH - Chinese (unspecified variant for backward compatibility; please select ZH-HANS or ZH-HANT instead)
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
                .setColor('#0070C9')
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
