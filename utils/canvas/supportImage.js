// Create image for support ticket

// Import necessary modules
const { createCanvas, loadImage } = require('canvas');

const image = './assets/images/support.png';

// Function to create a support image
module.exports = async () => {

    // Create canvas
    const canvas = createCanvas(700, 393);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    const margin = 20;
    const supportImage= await loadImage(image);

    ctx.drawImage(
        supportImage, 
        margin, 
        margin, 
        canvas.width - margin * 2, 
        canvas.height - margin * 2
    );

    // Return image buffer
    return canvas.toBuffer();
    
}