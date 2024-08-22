// Response to messages with commands

module.exports = async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("/")) return;

    const args = message.content.slice(1).split(" ")[0];

    try {
        const command = require(`../commands/${args}.js`);
        command.run(message);
    } catch (error) {
        console.log(`this command is not created yet: ${args}`, error.message);
    }
}