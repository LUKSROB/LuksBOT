// Command birthday: Manages user birthdays in the server

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setBirthday, getBirthday, delBirthday } = require('../../db/birthday');
const { COLORS } = require('../../config.json');

// Export the birthday command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Carga, obtiene o elimina la fecha de cumpleaños de un usuario')
        .addSubcommand(option => 
            option.setName('set')
                .setDescription('Establece la fecha de cumpleaños del usuario')
                .addNumberOption(opt =>
                opt.setName('day')
                    .setDescription('El día del cumpleaños')
                    .setMinValue(1)
                    .setMaxValue(31)
                    .setRequired(true)
                )
                .addNumberOption(opt =>
                    opt.setName('month')
                    .setDescription('El mes del cumpleaños')
                    .setMinValue(1)
                    .setMaxValue(12)
                    .setRequired(true)
                )
                .addNumberOption(opt =>
                    opt.setName('year')
                    .setDescription('El año del cumpleaños')
                    .setMinValue(1900)
                    .setMaxValue(new Date().getFullYear())
                    .setRequired(true)
                )
        )
        .addSubcommand(option => 
            option.setName('get')
                .setDescription('Obtiene la fecha de cumpleaños del usuario')
                .addUserOption(opt =>
                    opt.setName('user')
                    .setDescription('El usuario del que obtener la fecha de cumpleaños')
                    )
        )
        .addSubcommand(option =>
            option.setName('delete')
                .setDescription('Elimina tu fecha de cumpleaños')
        ),
    // Execute the command
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
                    .setColor(COLORS.PRIMARY)

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
                            .setColor(COLORS.PRIMARY)
                    } else {
                        embed.setTitle(`El usuario mencionado no ha establecido su fecha de cumpleaños todavia.`)
                            .setColor(COLORS.PRIMARY)
                    }
                    interaction
                        .reply({ embeds : [embed] })
                        .catch(console.error);

                } else {
                    if (user.id === interaction.user.id) {
                        const embed = new EmbedBuilder()
                            .setTitle(`Tu cumpleaños es el ${date[0]} de ${months[date[1]]}.`)
                            .setColor(COLORS.PRIMARY)

                        interaction
                            .reply({ embeds : [embed] })
                            .catch(console.error);
                    } else {
                        const embed = new EmbedBuilder()
                            .setTitle(`El cumpleaños de ${user.username} es el ${date[0]} de ${months[date[1]]}.`)
                            .setColor(COLORS.PRIMARY)

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