
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setBirthday, getBirthday, delBirthday } = require('../../db/birthday');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Charge the birthday date of a user')
        .addSubcommand(option => 
            option.setName('set')
                .setDescription('Birthday date of the user')
                .addStringOption(opt =>
                opt.setName('day')
                    .setDescription('The birthday date')
                    .setMinLength(1)
                    .setMaxLength(31)
                    .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('month')
                    .setDescription('The birthday month')
                    .setMinLength(1)
                    .setMaxLength(12)
                    .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('year')
                    .setDescription('The birthday year')
                    .setMinLength(4)
                    .setMaxLength(4)
                    .setRequired(true)
                )
        )
        .addSubcommand(option => 
            option.setName('get')
                .setDescription('Get the birthday date of the user')
                .addUserOption(opt =>
                    opt.setName('user')
                    .setDescription('The user to get the birthday date from')
                    )
        )
        .addSubcommand(option =>
            option.setName('delete')
                .setDescription('Delete your birthday date')
        ),

    execute: async (interaction, userData) => {

        months = {
            "1": "Enero",
            "2": "Febrero",
            "3": "Marzo",
            "4": "Abril",
            "5": "Mayo",
            "6": "Junio",
            "7": "Julio",
            "8": "Agosto",
            "9": "Septiembre",
            "10": "Octubre",
            "11": "Noviembre",
            "12": "Diciembre"
        };

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'set':
                const day = interaction.options.getString('day');
                const month = interaction.options.getString('month');
                const year = interaction.options.getString('year');

                await setBirthday(interaction.guild.id, interaction.user.id, {
                    birthday: [
                        day,
                        month,
                        year
                    ]
                })

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: `Requested by ${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL()
                    })
                    .setTitle(`Tu cumpleaños ha sido establecido correctamente`)
                    .setColor('#335577')

                interaction
                    .reply({ embeds : [embed] })
                    .catch(console.error);

                break;
            case 'get':
                const user = interaction.options.getUser('user' ) || interaction.user;
                const date = await getBirthday( interaction.guild.id, user.id );

                if (!date[0] || !date[1] || !date[2]) {
                    let embed = new EmbedBuilder()
                    if (user.id === interaction.user.id) {
                        embed.setTitle(`No has establecido tu fecha de cumpleaños todavia.`)
                            .setColor('#335577')
                    } else {
                        embed.setTitle(`El usuario mencionado no ha establecido su fecha de cumpleaños todavia.`)
                            .setColor('#335577')
                    }
                    interaction
                        .reply({ embeds : [embed] })
                        .catch(console.error);

                } else {
                    if (user.id === interaction.user.id) {
                        const embed = new EmbedBuilder()
                            .setTitle(`Tu cumpleaños es el ${date[0]} de ${months[date[1]]}.`)
                            .setColor('#335577')

                        interaction
                            .reply({ embeds : [embed] })
                            .catch(console.error);
                    } else {
                        const embed = new EmbedBuilder()
                            .setTitle(`El cumpleaños de ${user.username} es el ${date[0]} de ${months[date[1]]}.`)
                            .setColor('#335577')

                        interaction
                            .reply({ embeds : [embed] })
                            .catch(console.error);
                    }
                }
                break;
            case 'delete':
                const userId = interaction.user.id;
                await delBirthday(interaction.guild.id, userId);

                interaction
                    .reply(`Tu fecha de cumpleaños ha sido eliminada correctamente.`)
                    .catch(console.error);

                break;

        }
    }
};