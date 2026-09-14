// Functions to manage music playback

// Import necessary modules
const { EmbedBuilder, MessageFlags } = require('discord.js');
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

    if (volumeLevel) {
        reply = await volume(interaction, player, volumeLevel, true);
    }

    try {
        const resolve = await client.riffy.resolve({ query: query, requester: member.user.tag });
        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === 'playlist') {
            for (const track of tracks) {
                track.info.requester = member;
                await player.queue.add(track);
            }

            await interaction.editReply(`${tracks.length} canciones de ${playlistInfo.name} fueron añadidas a la cola.\n${reply ? reply : ''}`);

            if (!player.playing && !player.paused) {
                player.play();
            }

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = member;

            await player.queue.add(track);

            await interaction.editReply(`**${track.info.title}** fue añadida a la cola.\n${reply ? reply : ''}`);

            if (!player.playing && !player.paused) {
                player.play();
            }
        
        } else {
            await interaction.editReply(`No se encontraron resultados para esa canción.`);
        }
    } catch (error) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply('Ocurrió un error al intentar reproducir la canción.');
        } else {
            await interaction.editReply('Ocurrió un error al intentar reproducir la canción.');
        }
    }

    return player;
}

// Function to pause or resume the current track
async function pause( interaction, player ) {
    try {
        player.paused ? await player.pause(false) : await player.pause(true);
        return await interaction.editReply(player.paused ? 'Canción pausada ⏸️' : 'Canción reanudada ▶️');

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al pausar/reanudar la música!`, flags: MessageFlags.Ephemeral });
    }
}

// Function to resume the current track
async function resume( interaction, player ) {
    try {
        if (!player.paused) {
            return await interaction.editReply({ content: 'La música ya está en reproducción.', flags: MessageFlags.Ephemeral });
        }

        await player.pause(false);
        return await interaction.editReply('Canción reanudada ▶️');

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al reanudar la música!`, flags: MessageFlags.Ephemeral });
    }

}

// Function to skip the current track
async function skip( interaction, player ) {
    const { member } = interaction;

    const currentTrack = player.current;
    
    if (!currentTrack) {
        return await interaction.editReply({ content: 'No hay ninguna canción reproduciéndose.', flags: MessageFlags.Ephemeral });
    }

    const requesterId = currentTrack.info?.requester?.id || currentTrack.info?.requester?.user?.id;
    if (requesterId && requesterId !== member.id) {
        return await interaction.editReply({ content: "Solo el que solicitó la canción puede saltarla.", flags: MessageFlags.Ephemeral });
    }

    try {
        const title = currentTrack.info.title;
        await player.stop();
        return await interaction.editReply({ content: `Canción saltada: ${title}` });

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al saltar la canción!`, flags: 64 });
    }
}

// Function to stop the current playback
async function stop( interaction, player ) {
    const { member } = interaction;

    if (!player.current) {
        return await interaction.editReply({ content: 'No hay ninguna canción reproduciéndose.', flags: MessageFlags.Ephemeral });
    }
    
    const requesterId = player.current.info?.requester?.id || player.current.info?.requester?.user?.id;
    if (requesterId && requesterId !== member.id) {
        return await interaction.editReply({ content: "Solo el que solicitó la canción puede detenerla.", flags: MessageFlags.Ephemeral });
    }
    
    try {
        await player.destroy();
        return await interaction.editReply({ content: 'Reproducción detenida ⏹️', flags: MessageFlags.Ephemeral });

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al detener la reproducción!`, flags: MessageFlags.Ephemeral });
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
        return await interaction.editReply({ content: `❌ ¡Error al ajustar el volumen!`, flags: MessageFlags.Ephemeral });
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
        return await interaction.editReply({ content: `❌ ¡Error al cambiar el estado de bucle!`, flags: MessageFlags.Ephemeral });
    }
}

// Function to display the current queue
async function queue( interaction, player ) {
    
    if (player.queue.size === 0) {
        return await interaction.editReply({ content: 'La cola está vacía.', flags: MessageFlags.Ephemeral });
    }

    const tracks = player.queue.map(track => {
        return `• **${track.info.title.length < 26 ? track.info.title : track.info.title.slice(0, 26) + '...'}** - ${track.info.author}`;
    }).slice(0, 30);

    let description = tracks.join('\n');
    if (player.queue.size > 30) {
        description += `\n\n...y ${player.queue.size - 30} más`;
    }

    const embed = new EmbedBuilder()
        .setTitle('Cola de reproducción')
        .setDescription(description)
        .setFooter({ text: `Total de canciones: ${player.queue.size}` })
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