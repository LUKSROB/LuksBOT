// Command tic-tac-toe: Play a game of Tic Tac Toe

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder, ActivityType, MessageFlags } = require('discord.js');
const { activeGames, createBoard, handleBotMove, GAME_TIMEOUT_SECONDS } = require('../../utils/functions/tictactoe.js');
const { COLORS } = require('../../config.json');

// Export the tic-tac-toe command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('tic-tac-toe')
        .setDescription('Juega a Tic Tac Toe')
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('Usuario contra el que jugar')
                .setRequired(false)
        ),
    // Execute the command when invoked
    execute: async (interaction) => {

        const opponent = interaction.options.getUser('opponent');
        if (opponent && opponent.id === interaction.user.id) {
            return interaction.reply({ content: '❌ ¡No puedes jugar contra ti mismo!', flags: MessageFlags.Ephemeral });
        }

        let player2Id;
        let isBot;

        if (!opponent ||opponent.id === interaction.client.user.id) {
            player2Id = 'BOT';
            isBot = true;
        } else {
            player2Id = opponent.id;
            isBot = opponent.bot;
        }

        const player1Id = interaction.user.id;
        const board = Array(9).fill('⬜');
        const currentPlayer = Math.random() < 0.5 ? player1Id : player2Id;

        const session = {
            board,
            currentPlayer,
            player1Id,
            player2Id,
            isBot,
            lastInteractionTime: Date.now(),
            interactionId: interaction.id
        };

        const firstPlayerMention = currentPlayer === player1Id ? interaction.user.toString() : (isBot ? '🤖 Bot' : opponent.toString());

        const embed = new EmbedBuilder()
            .setTitle('🎮 Tres en Raya')
            .setDescription(
            `**¡Juego Comenzado!**\n\n` +
            `🎲 **Turno de:** ${firstPlayerMention}\n\n` +
            `📢 **Turno Actual:** ${firstPlayerMention}\n\n` +
            `🔴 **Jugador 1 (❌):** ${interaction.user}\n` +
            `🔵 **Jugador 2 (⭕):** ${isBot ? '🤖 Bot' : opponent}\n\n` +
            `ℹ️ **Cómo jugar:**\n• Haz clic en los botones para colocar tu marca\n• Consigue 3 en línea para ganar\n• El juego expira después de ${GAME_TIMEOUT_SECONDS / 60} minutos de inactividad`
            )
            .setColor(COLORS.GAMES);

        await interaction.reply({
            embeds: [embed],
            components: createBoard(board)
        });

        const message = await interaction.fetchReply();
        activeGames.set(message.id, session);

        interaction.client.activityManager?.setGame(interaction.guildId, message.id, {
            name: 'Tic Tac Toe',
            type: ActivityType.Playing
        });

        setTimeout(() => {
            activeGames.delete(message.id);
            interaction.client.activityManager?.clearGame(interaction.guildId, message.id);
        }, GAME_TIMEOUT_SECONDS * 1000);

        if (isBot && currentPlayer === player2Id) {
            setTimeout(() => handleBotMove(message, session, interaction), 700);
        }
    }
}