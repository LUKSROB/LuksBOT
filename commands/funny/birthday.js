// 

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setBirthday, getBirthday, delBirthday } = require('../../db/birthday');

// Export the birthday command module
module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Charge the birthday date of a user')
        .addSubcommand(option => 
            option.setName('set')
                .setDescription('Birthday date of the user')
                .addNumberOption(opt =>
                opt.setName('day')
                    .setDescription('The birthday date')
                    .setMinValue(1)
                    .setMaxValue(31)
                    .setRequired(true)
                )
                .addNumberOption(opt =>
                    opt.setName('month')
                    .setDescription('The birthday month')
                    .setMinValue(1)
                    .setMaxValue(12)
                    .setRequired(true)
                )
                .addNumberOption(opt =>
                    opt.setName('year')
                    .setDescription('The birthday year')
                    .setMinValue(1900)
                    .setMaxValue(new Date().getFullYear())
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
// Handle the 'set' subcommand
            case 'set':
                const day = interaction.options.getNumber('day');
                const month = interaction.options.getNumber('month');
                const year = interaction.options.getNumber('year');

                const birthday = userData.birthday;

                let reply

                if (birthday) {
                    reply = `Tu cumpleaños se ha actualizado correctamente: ${day} de ${months[month]} de ${year}.`;
                } else {
                    reply = `Tu cumpleaños ha sido establecido correctamente: ${day} de ${months[month]} de ${year}.`;
                }

                await setBirthday(interaction.user.id, {
                    birthday: [
                        day,
                        month,
                        year
                    ]
                })

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: `Solicitado por ${interaction.user.username}`,
                        iconURL: interaction.user.avatarURL()
                    })
                    .setTitle(reply)
                    .setColor('#335577')

                interaction
                    .reply({ embeds : [embed] })
                    .catch(console.error);

                break;
// Handle the 'get' subcommand
            case 'get':
                const user = interaction.options.getUser('user' ) || interaction.user;
                const date = await getBirthday(user.id);

                if (!date) {
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
// Handle the 'delete' subcommand
            case 'delete':
                
                await delBirthday(interaction.user.id);

                interaction
                    .reply(`Tu fecha de cumpleaños ha sido eliminada correctamente.`)
                    .catch(console.error);

                break;

        }
    }
};