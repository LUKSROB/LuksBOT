// Function to generate a image filled with a color

// Import necessary module
const { createCanvas } = require('@napi-rs/canvas');

// Function to generate a image filled with a specified hex color
function generateColorImage(hexColor) {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, 64, 64);
    return canvas.toBuffer("image/png");
}

// Export the function for use in other modules
module.exports = {
    generateColorImage
};