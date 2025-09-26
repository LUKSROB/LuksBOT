// Functions to manage music playback

// Import necessary modules
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config.json');

// Function to play a song or playlist
async function play( interaction, player ) {
    
    const { member, client, channel, options, guild, } = interaction;
    const query = options.getString('query');
    const volumeLevel = interaction.options.getNumber('volume');
    let reply

    if (!player) {
        player = client.riffy.createConnection({
            guildId: guild.id,
            voiceChannel: member.voice.channel.id,
            textChannel: channel.id,
            deaf: true,
        })
    }

    if (!player.connected) {
        try {
            await player.connect();
        } catch (error) {
            return await interaction.editReply('No se pudo conectar al canal de voz.', { flags: 64 });
        }
    }

    if (volumeLevel) {
        reply = await volume(interaction, player, volumeLevel, true);
    }

    try {
        const resolve = await client.riffy.resolve({ query: query, requester: member });
        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === 'playlist') {
            for (const track of tracks) {
                track.info.requester = member;
                await player.queue.add(track);
            }

            await interaction.editReply(`${tracks.length} canciones de ${playlistInfo.name} fueron añadidas a la cola.\n${reply ? reply : ''}`);

            if (!player.playing && !player.paused) return player.play();

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = member;

            await player.queue.add(track);

            await interaction.editReply(`**${track.info.title}** fue añadida a la cola.\n${reply ? reply : ''}`);

            if (!player.playing && !player.paused) return player.play();
        
        } else {
            return await interaction.editReply(`No se encontraron resultados para esa canción.`);
        }
    } catch (error) {
        return await interaction.editReply('Ocurrió un error al intentar reproducir la canción.');
    }
}

// Function to pause or resume the current track
async function pause( interaction, player ) {
    try {
        player.paused ? await player.pause(false) : await player.pause(true);
        return await interaction.editReply(player.paused ? 'Canción pausada ⏸️' : 'Canción reanudada ▶️');

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al pausar/reanudar la música!`, flags: 64 });
    }
}

// Function to resume the current track
async function resume( interaction, player ) {
    try {
        if (!player.paused) {
            return await interaction.editReply({ content: 'La música ya está en reproducción.', flags: 64 });
        }

        await player.pause(false);
        return await interaction.editReply('Canción reanudada ▶️');

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al reanudar la música!`, flags: 64 });
    }

}

// Function to skip the current track
async function skip( interaction, player ) {
    const { member } = interaction;

    if (player.current.info.requester !== member) {
        return await interaction.editReply({ content: "Solo el que solicitó la canción puede saltarla.", flags: 64 });
    }

    try {
        await player.stop();
        return await interaction.editReply({ content: `Canción saltada: ${player.current.info.title}` });

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al saltar la canción!`, flags: 64 });
    }
}

// Function to stop the current playback
async function stop( interaction, player ) {
    const { member } = interaction;
    
    if (player.current.info.requester !== member) {
        return await interaction.editReply({ content: "Solo el que solicitó la canción puede detenerla.", flags: 64 });
    }
    
    try {
        await player.destroy();
        return await interaction.editReply('Reproducción detenida ⏹️');

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al detener la reproducción!`, flags: 64 });
    }
}

// Function to adjust the volume
async function volume( interaction, player, volume, isCommand = false ) {

    try {
        if (isCommand) {
            await player.setVolume(volume);
            return `Volumen ajustado a ${volume} 🔊`;
        } else {
            await player.setVolume(volume);
            return await interaction.editReply(`Volumen ajustado a ${volume} 🔊`);
        }
        
    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al ajustar el volumen!`, flags: 64 });
    }
}

// Function to toggle or set the loop mode
async function loop( interaction, player, mode = null ) {

    try {
        if (mode) {
            await player.setLoop(mode);
            return await interaction.editReply(`Bucle de ${mode} activado 🔁`);
        
        } else if (player.loop === 'track') {
            await player.setLoop('queue');
            return await interaction.editReply('Bucle de lista de reproducción activado 🔂');

        } else if (player.loop === 'queue') {
            await player.setLoop('none');
            return await interaction.editReply('Bucle desactivado ⏹️');

        } else if (player.loop === 'none') {
            await player.setLoop('track');
            return await interaction.editReply('Bucle de canción activado 🔁');
        }
        
    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al cambiar el estado de bucle!`, flags: 64 });
    }
}

// Function to display the current queue
async function queue( interaction, player ) {
    
    if (player.queue.size === 0) {
        return await interaction.editReply({ content: 'La cola está vacía.', flags: 64 });
    }

    const tracks = player.queue.map(track => {
        return `• **${track.info.title.length < 26 ? track.info.title : track.info.title.slice(0, 26) + '...'}** - ${track.info.author}`;
    });

    const embed = new EmbedBuilder()
        .setTitle('Cola de reproducción')
        .setDescription(tracks.join('\n'))
        .setFooter(`Total de canciones: ${tracks.length}`)
        .setColor(COLORS.PRIMARY);

    return await interaction.editReply({ embeds: [embed] });
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