

const { EmbedBuilder } = require('discord.js');
const {
    activeGames,
    createBoard,
    checkWinner,
    isBoardFull,
    handleBotMove,
    GAME_TIMEOUT_SECONDS
} = require('../commands/funny/tic-tac-toe.js');

module.exports = async (interaction) => {
    const session = activeGames.get(interaction.message.id);
    if (!session) {
        return interaction.reply({ content: '⏰ Esta partida ha expirado.', flags: 64 });
    }

    if (Date.now() - session.lastInteractionTime > GAME_TIMEOUT_SECONDS * 1000) {
        activeGames.delete(interaction.message.id);
        return interaction.reply({ content: '⏰ Esta partida ha expirado debido a la inactividad.', flags: 64 });
    }

    if (interaction.user.id !== session.currentPlayer) {
        return interaction.reply({ content: '⚠️ ¡No es tu turno!', flags: 64 });
    }

    session.lastInteractionTime = Date.now();

    const position = parseInt(interaction.customId.split(':')[1]);
    if (session.board[position] !== '⬜') {
        return interaction.reply({ content: '⚠️ Esa posición ya está ocupada!', flags: 64 });
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
    } else if (isDraw) {
        desc = `🤝 **¡Juego terminado!**\n¡Es un empate!`;
        activeGames.delete(interaction.message.id);
    } else {
        desc = `📢 **Turno actual:** ${nextPlayer === session.player1Id ? interaction.user : (session.isBot ? '🤖 Bot' : `<@${session.player2Id}>`)}\n\n` +
            `🔴 Jugador 1 (❌): ${interaction.user}\n` +
            `🔵 Jugador 2 (⭕): ${session.isBot ? '🤖 Bot' : `<@${session.player2Id}>`}`;
    }

    const embed = new EmbedBuilder()
        .setTitle('🎮 Tic Tac Toe')
        .setDescription(desc)
        .setColor(isWinner ? 0x00FF00 : isDraw ? 0xFFFF00 : nextPlayer === session.player1Id ? 0xFF0000 : 0x0000FF);

    await interaction.update({
        embeds: [embed],
        components: createBoard(session.board)
    });

    if (!isWinner && !isDraw) {
        session.currentPlayer = nextPlayer;
        // Bot move
        if (session.isBot && session.currentPlayer === session.player2Id) {
            setTimeout(() => handleBotMove(interaction.message, session, interaction), 700);
        }
    }
}