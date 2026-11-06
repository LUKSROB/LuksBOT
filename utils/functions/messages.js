// Functions to generate random messages for user interactions

// Functions to generate random messages for welcome
function welcomeMessage(member) {

    const user = member.user.username;
    const random = Math.floor(Math.random() * 7);

    const welcomeMess = [
            `Bienvenid@ al servidor, ${user}!`,
            `Bienvenid@, ${user}!`,
            `Te damos la bienvenida, ${user}!`,
            `Es un placer tenerte aquí, ${user}!`,
            `Un ${user} salvaje apareció!`,
            `${user} ha llegado al servidor!`,
            `todo el mundo, ${user} ha llegado!`
        ];

    return welcomeMess[random];

}

// Function to generate a random description message
function descriptionMessage() {

    const random = Math.floor(Math.random() * 7);

    const descriptionMess = [
        'Esperamos que disfrutes tu estancia!',
        'Un gusto y no olvides leer las reglas del servidor!',
        'Recuerda respetar a los demás miembros!',
        'Si tienes alguna duda, no dudes en preguntar!',
        'Cualquier problema, no dudes en contactar a un moderador!',
        'Comparte tus ideas y diviértete!',
        'Recuerda que puedes invitar a tus amigos al servidor!'
    ];

    return descriptionMess[random];

}

// Function to generate a goodbye message when a user leaves
function goodbyeMessage(member) {

    const user = member.user.username;
    const random = Math.floor(Math.random() * 7);

    const goodbyeMess = [
            `Ay no..., ${user} nos hizo la abandonacion.`,
            `${user} no nos dejó, nosotros lo dejamos a él!`,
            `Hasta la vista, ${user}!`,
            `Nos vemos ${user}, portáte bien!`,
            `Que te vaya bien, ${user}!`,
            `Esperamos verte pronto, ${user}!`,
            `Adios, ${user}, te extrañaremos! (mentira)`
        ];

    return goodbyeMess[random];

}

// Function to format the reason for an event
function formatReason(reason) {

    if (!reason) return 'sin detalle';

    if (typeof reason === 'string') {
        return reason;
    }

    if (Buffer.isBuffer(reason)) {
        return reason.toString('utf8');
    }

    if (typeof reason === 'object') {
        const eventCode = reason.event !== undefined ? `event=${reason.event}` : 'event=unknown';
        let detail = reason.reason;

        if (Buffer.isBuffer(detail)) {
            detail = detail.toString('utf8');
        } else if (detail && detail.message) {
            detail = detail.message;
        } else if (detail && typeof detail !== 'string') {
            detail = JSON.stringify(detail);
        }

        return `${eventCode}, reason=${detail || 'sin detalle'}`;
    }

    return String(reason);

}

// Function to format the error for an event
function formatError(error) {

    if (!error) return 'sin detalle';
    if (typeof error === 'string') return error;
    if (Buffer.isBuffer(error)) return error.toString('utf8');
    if (error.message) return error.message;
    return String(error);

}

}

// Export the functions for use in other modules
module.exports = {
    welcomeMessage,
    descriptionMessage,
    goodbyeMessage,
    formatReason,
    formatError,
};