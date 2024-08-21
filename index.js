const { Client, Events } = require("discord.js");
const config = require('./config.json');

const client = new Client({
    intents: 53608447
});

//Conectar cliente = eventro on 
client.on(Events.ClientReady, async () => {
    console.log(`Connected to Discord! as ${client.user.username}`);
});

//respuesta a mensajes
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("-")) return;

    const args = message.content.slice(1).split(" ")[0];

    try {
        const command = require(`./commands/${args}.js`);
        command.run(message);
    } catch (error) {
        console.log(`No funca mano (-${args})`, error.message);
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    const channel = member.guild.channels.fetch(ch => ch.name === 'general');
    if (!channel) return;

    channel.send(`Bienvenido a ${member.guild.name}, ${member}!`);
});

// conectar bot al client
client.login(config.BOT_TOKEN);
