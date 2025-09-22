// Command play: Play a song

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');

// Export the play command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce una canción o agregala a la cola')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nombre o URL de la canción')
                .setRequired(true)
        ),
    // Execute the command
    execute: async ( interaction ) => {
        const { member, client, channel, options, guild, } = interaction;
        const query = options.getString('query');

        if (!member.voice.channel) {
            return interaction.reply('¡Debes estar en un canal de voz!');
        }

        let player = client.riffy.players.get(guild.id);

        if (!player) {
            player = client.riffy.createConnection({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: channel.id,
                deaf: true,
            })
        }

        const resolve = await client.riffy.resolve({ query: query, requester: member });
        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === 'playlist') {
            for (const track of tracks) {
                track.info.requester = member;
                player.queue.add(track);
            }

            await interaction.reply(`${tracks.length} canciones ${playlistInfo.name} fueron añadidas a la cola.`);

            if (!player.playing && !player.paused) return player.play();

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = member;

            player.queue.add(track);

            await interaction.reply(`**${track.info.title}** fue añadida a la cola.`);

            if (!player.playing && !player.paused) return player.play();

        } else {
            return interaction.reply(`No se encontraron resultados para esa canción.`);
        }
    }
};