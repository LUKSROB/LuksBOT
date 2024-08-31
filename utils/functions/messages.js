// Randomize messages to be sent to the user

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

module.exports = { welcomeMessage, descriptionMessage, goodbyeMessage };