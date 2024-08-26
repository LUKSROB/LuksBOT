// 

const { client } =require('../index.js');

module.exports =  async (interaction) => {
    if (interaction.isChatInputCommand()) {
        console.log(client.commands);
        const command = client.commands.get(interaction.commandName);
        console.log(command);
        command.execute(interaction).catch();
    } else {}
};