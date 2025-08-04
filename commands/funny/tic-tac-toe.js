const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

const activeGames = new Map();
const GAME_TIMEOUT_SECONDS = 300;

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

function checkWinner(board, symbol) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8], // rows
        [0,3,6],[1,4,7],[2,5,8], // cols
        [0,4,8],[2,4,6]          // diags
    ];
    return wins.some(line => line.every(i => board[i] === symbol));
}

function isBoardFull(board) {
    return board.every(cell => cell !== '⬜');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tic-tac-toe')
        .setDescription('Juega a Tic Tac Toe')
        .addUserOption(opt => opt.setName('opponent').setDescription('Usuario contra el que jugar').setRequired(false)),
    async execute(interaction) {

        await interaction.client.user.setActivity({
            name: '',
            type: 0,
            status: 'online',
        });

        const opponent = interaction.options.getUser('opponent');
        if (opponent && opponent.id === interaction.user.id) {
            return interaction.reply({ content: '❌ ¡No puedes jugar contra ti mismo!', flags: 64 });
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
            .setColor(0x2F3136);

        await interaction.reply({
            embeds: [embed],
            components: createBoard(board)
        });

        const message = await interaction.fetchReply();
        activeGames.set(message.id, session);

        setTimeout(() => activeGames.delete(message.id), GAME_TIMEOUT_SECONDS * 1000);

        // Bot move if bot goes first
        if (isBot && currentPlayer === player2Id) {
            setTimeout(() => handleBotMove(message, session, interaction), 700);
        }
    }
};

// --- Bot move logic ---
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