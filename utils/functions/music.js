// Functions to manage music playback

// Import necessary modules
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS } = require('../../config.json');
const connectionQueueByGuild = new Map();

// Function to sleep for a specified duration (in milliseconds)
function sleep(ms) {

    return new Promise((resolve) => setTimeout(resolve, ms));

}

// Function to execute a task with a lock for a specific guild connection
async function withGuildConnectionLock(guildId, task) {

    const previous = connectionQueueByGuild.get(guildId) || Promise.resolve();

    let releaseCurrent;
    const current = new Promise((resolve) => {
        releaseCurrent = resolve;
    });

    connectionQueueByGuild.set(guildId, current);

    await previous.catch(() => {});

    try {
        return await task();
    } finally {
        releaseCurrent();
        if (connectionQueueByGuild.get(guildId) === current) {
            connectionQueueByGuild.delete(guildId);
        }
    }

}

// Function to ensure a player connection for a guild
async function ensurePlayerConnection(client, guild, member, channel, existingPlayer) {

    return withGuildConnectionLock(guild.id, async () => {
        let player = existingPlayer;
        const failover = client.lavalinkFailover;

        if (failover && typeof failover.ensureReady === 'function') {
            const ready = await failover.ensureReady(7000, `play:${guild.id}`);
            if (!ready) {
                return null;
            }
        }

        if (
            player &&
            player.connected &&
            player.voiceChannel === member.voice.channel.id
        ) {
            return player;
        }

        if (
            player &&
            !player.connected &&
            player.voiceChannel === member.voice.channel.id
        ) {
            try {
                player.connect({
                    guildId: guild.id,
                    voiceChannel: member.voice.channel.id,
                    deaf: true,
                    mute: false
                });

                let reconnectTries = 10;
                while (reconnectTries > 0 && !player.connected) {
                    await sleep(200);
                    reconnectTries--;
                }

                if (player.connected) {
                    return player;
                }
            } catch (_) {}
        }

        if (player) {
            try {
                await player.destroy();
            } catch (_) {}
        }

        try {
            player = client.riffy.createConnection({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: channel.id,
                deaf: true
            });
        } catch (_) {
            return null;
        }

        let tries = 20;
        while (tries > 0 && !player.connected) {
            await sleep(200);
            tries--;
        }

        return player;
    });

}

// Function to play with connection retry logic
async function playWithConnectionRetry(interaction, player) {

    const { guild, member } = interaction;

    try {
        await player.play();
        return true;
    } catch (err) {
        const message = err?.message || '';
        const isConnectionNotInitiated = message.includes('Player connection is not initiated');

        if (!isConnectionNotInitiated) {
            throw err;
        }

        try {
            player.connect({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                deaf: true,
                mute: false
            });
            await sleep(1500);
            await player.play();
            return true;
        } catch (_) {
            await interaction.editReply('No se pudo establecer la conexión de voz con Lavalink. Intenta nuevamente.');
            return false;
        }
    }

}

// Function to play a song or playlist with the given player and interaction context
async function play( interaction, player ) {
    
    const { member, client, channel, options, guild, } = interaction;
    const query = options.getString('query');
    const volumeLevel = interaction.options.getNumber('volume');
    let reply

    player = await ensurePlayerConnection(client, guild, member, channel, player);

    if (!player || !player.connected) {
        await interaction.editReply('No pude iniciar la conexión de voz. Intenta nuevamente en unos segundos.');
        return null;
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
                if (!player.connected) {
                    await interaction.editReply('La conexión de voz no está lista todavía. Vuelve a intentarlo.');
                    return null;
                }
                const started = await playWithConnectionRetry(interaction, player);
                if (!started) {
                    return null;
                }
            }

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = member;

            await player.queue.add(track);

            await interaction.editReply(`**${track.info.title}** fue añadida a la cola.\n${reply ? reply : ''}`);

            if (!player.playing && !player.paused) {
                if (!player.connected) {
                    await interaction.editReply('La conexión de voz no está lista todavía. Vuelve a intentarlo.');
                    return null;
                }
                const started = await playWithConnectionRetry(interaction, player);
                if (!started) {
                    return null;
                }
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
        return await interaction.editReply({ content: `Canción saltada: ${title} ${player.queue?.length !== 0 ? `\nReproduciendo: ${player.queue[0].info.title}` : ''}`, flags: MessageFlags.Ephemeral });

    } catch (err) {
        return await interaction.editReply({ content: `❌ ¡Error al saltar la canción!`, flags: MessageFlags.Ephemeral });
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
        interaction.client.activityManager?.clearMusic(player.guildId);
        
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

// Function to destroy the player and clear the music activity
async function destroy(player, channel, embed) {

    channel?.client?.activityManager?.clearMusic(player.guildId);

    await player.destroy();
    await channel.send({ embeds: [embed] });

}

// Export the functions for use in other modules
module.exports = {
    sleep,
    withGuildConnectionLock,
    ensurePlayerConnection,
    playWithConnectionRetry,
    play,
    pause,
    resume,
    stop,
    skip,
    volume,
    loop,
    queue,
    destroy
};