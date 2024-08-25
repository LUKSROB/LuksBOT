const { GuildMember } = require('discord.js');
const { createCanvas, registerFont, loadImage } = require('canvas');

const defaultIcon = 'https://cdn.discordapp.com/embed/avatars/0.png';
const backgroundPath = './assets/images/welcome.jpg';
const fontPath = './assets/fonts/Super_Squad.ttf';
const avatarRadius = 150;

registerFont(fontPath, { family: 'SuperSquad' });

/**
@param {GuildMember} member
*/
module.exports = async (member) => {
    // Get user data
    const username = member.user.username;
    const avatar = member.user.avatarURL({ size: 256, extension: 'png' }) || defaultIcon;

    // Create canvas
    const canvas = createCanvas(1200, 800);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    const margin = 20;
    const background = await loadImage(backgroundPath);

    ctx.drawImage(
        background, 
        margin, 
        margin, 
        canvas.width - margin * 2, 
        canvas.height - margin * 2
    );

    // Draw username
    ctx.font = '80px SuperSquad';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 5;

    const usernameMetrics = ctx.measureText(username);

    ctx.fillText(
        username, 
        canvas.width / 2 - usernameMetrics.width / 2, 
        canvas.height * 3 / 4 - 30
    );

    // Draw subtitle
    ctx.font = '50px SuperSquad';
    ctx.fillStyle = '#ffffff';

    const subtitle = 'Bienvenid@ al servidor';
    const subtitleMetrics = ctx.measureText(subtitle);

    ctx.fillText(
        subtitle, 
        canvas.width / 2 - subtitleMetrics.width / 2, 
        canvas.height * 3 / 4 + 60
    );

    // Draw avatar
    const avatarImage = await loadImage(avatar);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(
        canvas.width / 2, 
        canvas.height / 3, 
        avatarRadius, 
        0, 
        Math.PI * 2
    );
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'rgba(0, 0, 0, 0)';

    ctx.beginPath();
    ctx.arc(
        canvas.width / 2, 
        canvas.height / 3, 
        avatarRadius - 5, 
        0, 
        Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
        avatarImage, 
        canvas.width / 2 - (avatarRadius - 5), 
        canvas.height / 3 - (avatarRadius - 5), 
        avatarRadius * 2, 
        avatarRadius * 2
    );

    return canvas.toBuffer();
}