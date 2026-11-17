// Command filter: add paraams to filter in guild

// Import necessary modules
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { updateGuildContentFilter, addWordToFilter, removeWordFromFilter, addWebToFilter, removeWebFromFilter } = require('../../db/contentFilter');

// Export the filter command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Gestiona el filtro de contenido del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(option =>
            option.setName('estado')
                .setDescription('Muestra el estado actual del filtro')
        )
        .addSubcommand(sub =>
            sub.setName('activar')
                .setDescription('Activa el filtro de contenido')
        )
        .addSubcommand(sub =>
            sub.setName('desactivar')
                .setDescription('Desactiva el filtro de contenido')
        )
        .addSubcommand(sub =>
            sub.setName('agregarpalabra')
                .setDescription('Agrega una palabra al filtro')
                .addStringOption(opt =>
                    opt
                        .setName('palabra')
                        .setDescription('Palabra a agregar')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('removerpalabra')
                .setDescription('Remueve una palabra del filtro')
                .addStringOption(opt =>
                    opt.setName('palabra')
                        .setDescription('Palabra a remover')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('agregarweb')
                .setDescription('Agrega un sitio web al filtro')
                .addStringOption(opt =>
                    opt.setName('web')
                        .setDescription('Sitio web a agregar (ej: pornhub.com)')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('removerweb')
                .setDescription('Remueve un sitio web del filtro')
                .addStringOption(opt =>
                    opt.setName('web')
                        .setDescription('Sitio web a remover')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('listar')
                .setDescription('Lista todas las palabras y webs filtrados')
        ),
    
    // Execute the command when invoked
    execute : async (interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'estado') {
                const { getGuildContentFilter } = require('../../db/contentFilter');
                const filter = await getGuildContentFilter(guildId);
                const status = filter.enabled ? '✅ Activado' : '❌ Desactivado';
                const wordsCount = filter.words?.length || 0;
                const websCount = filter.webs?.length || 0;

                return interaction.editReply({
                    content: `
**Estado del Filtro de Contenido:**
Estado: ${status}
Palabras filtradas: ${wordsCount}
Sitios web filtrados: ${websCount}
                    `.trim()
                });
            }

            if (subcommand === 'activar') {
                await updateGuildContentFilter(guildId, { enabled: true });
                return interaction.editReply('✅ Filtro de contenido activado');
            }

            if (subcommand === 'desactivar') {
                await updateGuildContentFilter(guildId, { enabled: false });
                return interaction.editReply('❌ Filtro de contenido desactivado');
            }

            if (subcommand === 'agregarpalabra') {
                const word = interaction.options.getString('palabra');
                await addWordToFilter(guildId, word);
                return interaction.editReply(`✅ Palabra \`${word}\` agregada al filtro`);
            }

            if (subcommand === 'removerpalabra') {
                const word = interaction.options.getString('palabra');
                await removeWordFromFilter(guildId, word);
                return interaction.editReply(`✅ Palabra \`${word}\` removida del filtro`);
            }

            if (subcommand === 'agregarweb') {
                const web = interaction.options.getString('web');
                await addWebToFilter(guildId, web);
                return interaction.editReply(`✅ Sitio web \`${web}\` agregado al filtro`);
            }

            if (subcommand === 'removerweb') {
                const web = interaction.options.getString('web');
                await removeWebFromFilter(guildId, web);
                return interaction.editReply(`✅ Sitio web \`${web}\` removido del filtro`);
            }

            if (subcommand === 'listar') {
                const { getGuildContentFilter } = require('../../db/contentFilter');
                const filter = await getGuildContentFilter(guildId);
                
                const words = filter.words?.length > 0 
                    ? filter.words.slice(0, 20).join(', ')
                    : '(ninguna)';
                const webs = filter.webs?.length > 0
                    ? filter.webs.slice(0, 10).join('\n')
                    : '(ninguna)';

                const totalWords = filter.words?.length || 0;
                const totalWebs = filter.webs?.length || 0;

                return interaction.editReply({
                    content: `
**Palabras Filtradas (${totalWords}):**
\`\`\`${words}\`\`\`

**Sitios Web Filtrados (${totalWebs}):**
\`\`\`${webs}\`\`\`

*Usa el dashboard para gestionar más elementos*
                    `.trim()
                });
            }

        } catch (error) {
            console.error('[filtro command] Error:', error);
            return interaction.editReply(`❌ Error: ${error.message}`);
        }
    }
};
