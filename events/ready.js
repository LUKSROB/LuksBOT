// Message when the bot is ready

const { ActionRowBuilder, AttachmentBuilder, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const { TICKETS_ID } = require("../config.json");
const invites = require("../utils/functions/invites");
const supportImage = require('../utils/canvas/supportImage');

module.exports = async (client) => {
    const buffer = await supportImage();
    const attachment = new AttachmentBuilder(
        buffer, 
        {
            name: 'support-image.png'
        }
    );

    const embed = new EmbedBuilder()
        .setTitle('Panel de soporte')
        .setDescription('Si tienes alguna duda o problema, no dudes en solicitar un ticket de soporte')
        .setImage('attachment://support-image.png')

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setPlaceholder('Abre un ticket de soporte')
            .setMaxValues(1)
            .setMinValues(1)
            .setCustomId('createTicket')
            .setOptions([{
                label: 'Soporte',
                emoji: '🎫',
                description: 'Abre un ticket de soporte',
                value: 'soporte'
            }, {
                label: 'Reporte',
                emoji: '🚨',
                description: 'Reporta a un usuario o una actividad',
                value: 'reporte'
            }, {
                label: 'Donaciones',
                emoji: '💸',
                description: 'Apoya a la comunidad',
                value: 'donaciones'
            }])
    )

    const channel = await client.channels.fetch(TICKETS_ID);
        if (channel) {
            await channel.send({
                embeds: [embed],
                files: [attachment],
                components: [menu]
            })
        }
        
    console.log(`Connected to Discord! as ${client.user.username}`);

    await invites.updateCache(client);
};