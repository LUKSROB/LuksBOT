// Function to get month name from month number


function getMonths(month) {
    const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre"
    ];

    return months[month - 1];
}

// Export the function for use in other modules
module.exports = {
    getMonths
};