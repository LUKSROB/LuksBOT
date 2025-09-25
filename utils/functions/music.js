// Functions to manage music playback

// Import necessary modules
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config.json');

// Function to play a song or playlist
async function play( interaction, player ) {
    
    const { member, client, channel, options, guild, } = interaction;
    const query = options.getString('query');

    if (!player) {
        player = client.riffy.createConnection({
            guildId: guild.id,
            voiceChannel: member.voice.channel.id,
            textChannel: channel.id,
            deaf: true,
        })
    }

    try {
        const resolve = await client.riffy.resolve({ query: query, requester: member });
        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === 'playlist') {
            for (const track of tracks) {
                track.info.requester = member;
                player.queue.add(track);
            }

            await interaction.editReply(`${tracks.length} canciones de ${playlistInfo.name} fueron añadidas a la cola.`);

            if (!player.playing && !player.paused) return player.play();

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = member;

            player.queue.add(track);

            await interaction.editReply(`**${track.info.title}** fue añadida a la cola.`);

            if (!player.playing && !player.paused) return player.play();
        
        } else {
            return interaction.editReply(`No se encontraron resultados para esa canción.`);
        }
    } catch (error) {
        return interaction.followUp('Ocurrió un error al intentar reproducir la canción.');
    }
}

// Function to pause or resume the current track
async function pause( interaction, player ) {
    try {
        player.paused ? await player.pause(false) : await player.pause(true);
        return interaction.reply(player.paused ? 'Canción pausada ⏸️' : 'Canción reanudada ▶️');

    } catch (err) {
        return interaction.reply({ content: `❌ ¡Error al pausar/reanudar la música!`, flags: 64 });
    }
}

// Function to resume the current track
async function resume( interaction, player ) {
    try {
        if (!player.paused) {
            return interaction.reply({ content: 'La música ya está en reproducción.', flags: 64 });
        }

        await player.pause(false);
        return interaction.reply('Canción reanudada ▶️');

    } catch (err) {
        return interaction.reply({ content: `❌ ¡Error al reanudar la música!`, flags: 64 });
    }

}

// Function to skip the current track
async function skip( interaction, player ) {
    const { member } = interaction;
    if (player.current.info.requester !== member) {
        return interaction.reply({ content: "Solo el que solicitó la canción puede saltarla.", flags: 64 });
    }

    try {
        await interaction.reply({ content: `Canción saltada: ${player.current.info.title}` });
        return player.stop();
    
    } catch (err) {
        return interaction.reply({ content: `❌ ¡Error al saltar la canción!`, flags: 64 });
    }
}

// Function to stop the current playback
async function stop( interaction, player ) {
    const { member } = interaction;
    if (player.current.info.requester !== member) {
        return interaction.reply({ content: "Solo el que solicitó la canción puede detenerla.", flags: 64 });
    }
    
    try {
        await player.destroy();
        return interaction.reply('Reproducción detenida ⏹️');
    
    } catch (err) {
        return interaction.reply({ content: `❌ ¡Error al detener la reproducción!`, flags: 64 });
    }
}

// Function to adjust the volume
async function volume( volume, player ) {

    try {
        await player.setVolume(volume);
        return interaction.reply(`Volumen ajustado a ${volume} 🔊`);

    } catch (err) {
        return interaction.reply({ content: `❌ ¡Error al ajustar el volumen!`, flags: 64 });
    }
}

// Function to toggle or set the loop mode
async function loop( interaction, player, mode = null ) {

    try {
        if (mode) {
            player.setLoop(mode);
            await interaction.reply(`Bucle de ${mode} activado 🔁`);
        
        } else if (player.loop === 'track') {
            player.setLoop('queue');
            await interaction.reply('Bucle de lista de reproducción activado 🔂');
        
        } else if (player.loop === 'queue') {
            player.setLoop('none');
            await interaction.reply('Bucle desactivado ⏹️');
        
        } else if (player.loop === 'none') {
            player.setLoop('track');
            await interaction.reply('Bucle de canción activado 🔁');
        }
        
    } catch (err) {
        return interaction.reply({ content: `❌ ¡Error al cambiar el estado de bucle!`, flags: 64 });
    }
}

// Function to display the current queue
async function queue( interaction, player ) {
    
    if (player.queue.size === 0) {
        return interaction.reply({ content: 'La cola está vacía.', flags: 64 });
    }

    const tracks = player.queue.map(track => {
        return `• **${track.info.title.length < 26 ? track.info.title : track.info.title.slice(0, 26) + '...'}** - ${track.info.author}`;
    });

    const embed = new EmbedBuilder()
        .setTitle('Cola de reproducción')
        .setDescription(tracks.join('\n'))
        .setFooter(`Total de canciones: ${tracks.length}`)
        .setColor(COLORS.PRIMARY);

    return interaction.reply({ embeds: [embed] });
}

// Export the functions for use in other modules
module.exports = {
    play,
    pause,
    resume,
    stop,
    skip,
    volume,
    loop,
    queue
};