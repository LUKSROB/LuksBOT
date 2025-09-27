// Functions to manipulate and extract colors

// Import necessary modules
const sharp = require('sharp');
const fetch = require('node-fetch');

/**
 * Detecta color promedio desde link o buffer de imagen
 * @param {string|Buffer} input - Puede ser URL o Buffer
 */

// Function to get the dominant color from an image URL or buffer
async function getDominantColor(input) {

    let buffer;

    try {
        if (input && typeof input === "object" && input.url) {
            const response = await fetch(input.url);
            if (!response.ok) throw new Error("No se pudo descargar la imagen desde el attachment");
            buffer = await response.buffer();
        } else if (typeof input === "string") {
            const response = await fetch(input);
            if (!response.ok) throw new Error("No se pudo descargar la imagen desde URL");
            buffer = await response.buffer();
        }

        const { data } = await sharp(buffer)
        .resize(1, 1)
        .raw()
        .toBuffer({ resolveWithObject: true });

        const [r, g, b] = data;
        return { r, g, b };

    } catch (error) {
        console.log(error);
    }
}

// Function to get a color palette from an image URL or buffer
async function getPaletteColor(input) {

    let buffer;

    try {
        if (input && typeof input === "object" && input.url) {
            const response = await fetch(input.url);
            if (!response.ok) throw new Error("No se pudo descargar la imagen desde el attachment");
            buffer = await response.buffer();
        } else if (typeof input === "string") {
            const response = await fetch(input);
            if (!response.ok) throw new Error("No se pudo descargar la imagen desde URL");
            buffer = await response.buffer();
        }

        const response = await sharp(buffer)
            .resize(colorCount, 1, { fit: 'cover' })
            .raw()
            .toBuffer({ resolveWithObject: true });

        let palette = [];
        for (let i = 0; i < response.info.width; i++) {
            const idx = i * response.info.channels;
            const r = response.data[idx];
            const g = response.data[idx + 1];
            const b = response.data[idx + 2];
            palette.push({ r, g, b });
        }

        return palette;

    } catch (error) {
        throw new Error('No se pudo obtener la imagen. Asegúrate de que sea una imagen o URL válida.');
    }
}

// Function to convert HEX color to RGB
function hexToRgb( color ) {
    color = validateHex(color);

    const r = parseInt(color.substr(0,2), 16);
    const g = parseInt(color.substr(2,2), 16);
    const b = parseInt(color.substr(4,2), 16);

    return validateRgb(r, g, b);
}

// Function to convert RGB color to HEX
function rgbToHex( r, g, b ) {
    ({ r, g, b } = validateRgb(r, g, b));

    return `#${[r, g, b].map(item =>
        item.toString(16).padStart(2, '0').toUpperCase()
    ).join('')}`;
}

// Function to determine if a HEX color is dark
function isDarkHex(color) {
    const { r, g, b } = hexToRgb(color);
    return isDarkRgb(r, g, b);

}

// Function to determine if an RGB color is dark
function isDarkRgb(r, g, b) {
    ({ r, g, b } = validateRgb(r, g, b));
    let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    luminance = parseInt(luminance);
    
    return (luminance < 60);
}

// Function to determine if a HEX color is very dark
function isVeryDarkHex(color) {
    const { r, g, b } = hexToRgb(color);
    return isVeryDarkRgb(r, g, b);
}

// Function to determine if an RGB color is very dark
function isVeryDarkRgb(r, g, b) {
    ({ r, g, b } = validateRgb(r, g, b));
    let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    luminance = parseInt(luminance);

    return (luminance < 30);
}

// Function to adjust the brightness of a HEX color
function brightnessHex(color, amount = 1) {
    let { r, g, b } = hexToRgb(color);

    r = Math.min(255, Math.max(0, Math.round(r * amount)));
    g = Math.min(255, Math.max(0, Math.round(g * amount)));
    b = Math.min(255, Math.max(0, Math.round(b * amount)));

    return rgbToHex(r, g, b);
}

// Function to invert a HEX color
function invertColorHex(color) {
    let { r, g, b } = hexToRgb(color);
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
    return rgbToHex(r, g, b);
}

// Function to validate HEX color format
function validateHex(color) {
    if (typeof color !== 'string') throw new Error('El color debe ser una cadena hexadecimal.');
    if (!/^#?[0-9A-Fa-f]{6}$/.test(color)) throw new Error('El color debe ser una cadena hexadecimal válida de 6 dígitos.');
    if (color.startsWith('#')) color = color.slice(1);
    return color.toUpperCase();

}

// Function to validate RGB color values
function validateRgb(r, g, b) {
    r = Math.min(255, Math.max(0, Math.round(r)));
    g = Math.min(255, Math.max(0, Math.round(g)));
    b = Math.min(255, Math.max(0, Math.round(b)));
    return { r, g, b };
}

// Export the functions for use in other modules
module.exports = {
    getDominantColor,
    getPaletteColor,
    hexToRgb,
    rgbToHex,
    isDarkHex,
    isDarkRgb,
    isVeryDarkHex,
    isVeryDarkRgb,
    brightnessHex,
    invertColorHex,
    validateHex,
    validateRgb
};