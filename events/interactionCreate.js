// Handler interactions for the bot

module.exports = async (interaction) => {
    const client = interaction.client;

    try{
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            command.execute(interaction).catch();
        } else {
            try {
                const execute = require(`../interactions/${interaction.customId}.js`);
                execute(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    } catch (error) {
        console.error(error);
    }
};