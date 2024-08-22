module.exports = {
    description: 'Repeat a argument that you provide',
    run: async (message) => {
        const args = message.content.split(' ').slice(1).join(' ');

        if (args.length < 1) return message.reply('You need to provide a message to say');
        
        message.reply(args);
    }
}