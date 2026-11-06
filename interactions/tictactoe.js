// Interaction handler for Tic Tac Toe game

// Import necessary modules
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { activeGames, createBoard, checkWinner, isBoardFull, handleBotMove, GAME_TIMEOUT_SECONDS } = require('../utils/functions/tictactoe.js');
const { COLORS } = require('../config.json');

// Export the interaction handler for Tic Tac Toe game
module.exports = async (interaction) => {

    const session = activeGames.get(interaction.message.id);
    if (!session) {
        return interaction.reply({ content: '⏰ Esta partida ha expirado.', flags: MessageFlags.Ephemeral });
    }

    if (Date.now() - session.lastInteractionTime > GAME_TIMEOUT_SECONDS * 1000) {
        activeGames.delete(interaction.message.id);
        interaction.client.activityManager?.clearGame(interaction.guildId, interaction.message.id);

        return interaction.reply({ content: '⏰ Esta partida ha expirado debido a la inactividad.', flags: MessageFlags.Ephemeral });
    }

    if (interaction.user.id !== session.currentPlayer) {
        return interaction.reply({ content: '⚠️ ¡No es tu turno!', flags: MessageFlags.Ephemeral });
    }

    session.lastInteractionTime = Date.now();

    const position = parseInt(interaction.customId.split(':')[1]);
    if (session.board[position] !== '⬜') {
        return interaction.reply({ content: '⚠️ Esa posición ya está ocupada!', flags: MessageFlags.Ephemeral });
    }

    session.board[position] = session.currentPlayer === session.player1Id ? '❌' : '⭕';

    const currentSymbol = session.currentPlayer === session.player1Id ? '❌' : '⭕';
    const isWinner = checkWinner(session.board, currentSymbol);
    const isDraw = !isWinner && isBoardFull(session.board);

    let nextPlayer = session.currentPlayer === session.player1Id ? session.player2Id : session.player1Id;

    let desc;
    if (isWinner) {
        desc = `🎉 **¡Juego terminado!**\n👑 Ganador: ${interaction.user}`;
        activeGames.delete(interaction.message.id);
        interaction.client.activityManager?.clearGame(interaction.guildId, interaction.message.id);
        
    } else if (isDraw) {
        desc = `🤝 **¡Juego terminado!**\n¡Es un empate!`;
        activeGames.delete(interaction.message.id);
        interaction.client.activityManager?.clearGame(interaction.guildId, interaction.message.id);

    } else {
        desc = `📢 **Turno actual:** ${nextPlayer === session.player1Id ? interaction.user : (session.isBot ? '🤖 Bot' : `<@${session.player2Id}>`)}\n\n` +
            `🔴 Jugador 1 (❌): ${interaction.user}\n` +
            `🔵 Jugador 2 (⭕): ${session.isBot ? '🤖 Bot' : `<@${session.player2Id}>`}`;
    }

    const embed = new EmbedBuilder()
        .setTitle('🎮 Tic Tac Toe')
        .setDescription(desc)
        .setColor(isWinner ? COLORS.SUCCESS : isDraw ? COLORS.WARNING : nextPlayer === session.player1Id ? COLORS.DANGER : COLORS.GAMES);

    await interaction.update({
        embeds: [embed],
        components: createBoard(session.board)
    });

    if (!isWinner && !isDraw) {
        session.currentPlayer = nextPlayer;

        if (session.isBot && session.currentPlayer === session.player2Id) {
            setTimeout(() => handleBotMove(interaction.message, session, interaction), 700);
        }
    }

}