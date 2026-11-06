// Functions for mathematical operations

// Function to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {

    return Math.floor(Math.random() * (max - min + 1)) + min;

}

// Export the functions for use in other modules
module.exports = {
    getRandomInt
};