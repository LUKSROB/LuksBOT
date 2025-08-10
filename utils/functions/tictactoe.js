// Functions 

const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const activeGames = new Map();
const GAME_TIMEOUT_SECONDS = 300;

// Function createBoard initializes a Tic Tac Toe board
function createBoard(board) {
    return [
        new ActionRowBuilder().addComponents(
            ...board.slice(0, 3).map((cell, i) => new ButtonBuilder()
                .setCustomId(`tictactoe:${i}`)
                .setLabel(cell)
                .setStyle(cell === '❌' ? ButtonStyle.Danger : cell === '⭕' ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(cell !== '⬜')
            )
        ),
        new ActionRowBuilder().addComponents(
            ...board.slice(3, 6).map((cell, i) => new ButtonBuilder()
                .setCustomId(`tictactoe:${i + 3}`)
                .setLabel(cell)
                .setStyle(cell === '❌' ? ButtonStyle.Danger : cell === '⭕' ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(cell !== '⬜')
            )
        ),
        new ActionRowBuilder().addComponents(
            ...board.slice(6, 9).map((cell, i) => new ButtonBuilder()
                .setCustomId(`tictactoe:${i + 6}`)
                .setLabel(cell)
                .setStyle(cell === '❌' ? ButtonStyle.Danger : cell === '⭕' ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(cell !== '⬜')
            )
        )
    ];
}

// Function to check if board is full
function isBoardFull(board) {
    return board.every(cell => cell !== '⬜');
}

// Function to check if a player has won
function checkWinner(board, symbol) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8], // rows
        [0,3,6],[1,4,7],[2,5,8], // cols
        [0,4,8],[2,4,6]          // diags
    ];
    return wins.some(line => line.every(i => board[i] === symbol));
}

// Function to handle bot moves in Tic Tac Toe
function handleBotMove(message, session) {
    // Simple AI: pick random empty cell
    const emptyCells = session.board.map((cell, i) => cell === '⬜' ? i : null).filter(i => i !== null);
    if (emptyCells.length === 0) return;
    const move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    session.board[move] = '⭕';

    const isWinner = checkWinner(session.board, '⭕');
    const isDraw = !isWinner && isBoardFull(session.board);

    let desc;
    if (isWinner) {
        desc = `🎉 **¡Juego terminado!**\n👑 Ganador: 🤖 Bot`;
        activeGames.delete(message.id);
        } else if (isDraw) {
        desc = `🤝 **¡Juego terminado!**\n¡Es un empate!`;
        activeGames.delete(message.id);
        } else {
        session.currentPlayer = session.player1Id;
        desc = `📢 **Turno actual:** <@${session.player1Id}>\n\n` +
            `🔴 Jugador 1 (❌): <@${session.player1Id}>\n` +
            `🔵 Jugador 2 (⭕): 🤖 Bot`;
    }

    const embed = new EmbedBuilder()
        .setTitle('🎮 Tic Tac Toe')
        .setDescription(desc)
        .setColor(isWinner ? 0x00FF00 : isDraw ? 0xFFFF00 : 0xFF0000);

    message.edit({
        embeds: [embed],
        components: createBoard(session.board)
    });
}

module.exports.activeGames = activeGames;
module.exports.createBoard = createBoard;
module.exports.checkWinner = checkWinner;
module.exports.isBoardFull = isBoardFull;
module.exports.handleBotMove = handleBotMove;
module.exports.GAME_TIMEOUT_SECONDS = GAME_TIMEOUT_SECONDS;