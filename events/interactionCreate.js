// 

module.exports =  async (interaction) => {
    const client = interaction.client;

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        command.execute(interaction).catch();
    } else {}
};