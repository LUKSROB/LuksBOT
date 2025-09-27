// Function to generate a image filled with a color

// Import necessary module
const { createCanvas } = require('@napi-rs/canvas');

// Function to generate a image filled with a specified hex color
function generateColorImage(palette, colorCount = 1) {
    const width = 64
    let height = 0
    colorCount === 1 ? height = 64 : height = 16;
    const canvas = createCanvas(width , height * colorCount);
    const ctx = canvas.getContext('2d');
    if (colorCount === 1) {
        ctx.fillStyle = palette;
        ctx.fillRect(0, 0, width, height);
    } else {
        for (let i = 0; i < colorCount; i++) {
            ctx.fillStyle = palette[i];
            ctx.fillRect(0, i * height, width, height);
        }
    } 
    return canvas.toBuffer("image/png");
}

// Export the function for use in other modules
module.exports = {
    generateColorImage
};