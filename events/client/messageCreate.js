// Event handler for message creation


// Import necessary modules
const { MessageFlags } = require('discord.js');
// Export the message create event handler
module.exports = async (message) => {

    if (message.author.bot) return;
    if (!message.guild) return;

    const filter = message.client.contentFilter;
    if (filter && typeof filter.test === 'function' && filter.test(message.content)) {
        try {
            await message.delete();
            await message.channel.send({
                content: `${message.author}, tu mensaje fue eliminado por el filtro automático de contenido.`,
                allowedMentions: { users: [message.author.id] }
            });
        } catch (error) {
            console.warn('[messageCreate] No se pudo aplicar el filtro automático:', error.message || error);
        }
        return;
    }

    if (message.content.startsWith("/")) {
        const args = message.content.slice(1).split(" ")[0];

        const client = message.client;
        const command = client.commands.get(args);
        if (!command || typeof command.run !== 'function') {
            await message.reply(`El comando \`${args}\` no fue creado aun, \n si desea solicitarlo, por favor contacte al administrador.`, { flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            command.run(message);
        } catch (error) {
            console.log(`Este comando no existe: ${args}`, error.message);

            message.reply(`El comando \`${args}\` no fue creado aun, \n si desea solicitarlo, por favor contacte al administrador.`, { flags: MessageFlags.Ephemeral });
        }
    }
    
}