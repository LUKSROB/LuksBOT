// Close a ticket

module.exports = async (interaction) => {
    const {channel, guild} = interaction;

    const ticketOwner = await guild.members.fetch(channel.topic)
        .catch(err => console.error(err));

    interaction.reply('Ticket cerrado!')
        .then(() => {
            channel.delete();
            if (ticketOwner) {
                ticketOwner.send('Tu ticket ya fue cerrado');
            }
        })
}