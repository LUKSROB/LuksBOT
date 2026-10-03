// Event handler for when the client is ready

const { updateCache } = require('../../utils/functions/invites')
const { setGuild } = require('../../db/guild')
const path = require('path')
const { registerFont } = require('musicard');
const fontPath = path.resolve(__dirname, '../../assets/fonts/YujiSyuku-Regular.ttf');

module.exports = async (client) => {
    client.riffy.init(client.user.id);
    console.log(`Connected to Discord! as ${client.user.username}`);

    await registerFont(fontPath, 'GoogleSans');

    client.guilds.cache.map(async guild => {
        await setGuild(guild);
    });

    updateCache(client);

};