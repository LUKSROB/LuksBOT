// Event handler for message creation

// Export the messageCreate event handler
module.exports = async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith("/")) {
        const args = message.content.slice(1).split(" ")[0];

        const client = message.client;
        const command = client.commands.get(args);

        try {
            command.run(message);
        } catch (error) {
            console.log(`Este comando no existe: ${args}`, error.message);

            message.reply(`El comando \`${args}\` no fue creado aun, \n si desea solicitarlo, por favor contacte al administrador.`, { ephemeral: true });
        }
    }
}