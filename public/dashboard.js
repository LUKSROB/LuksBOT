const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const statusEl = document.getElementById('status');
const panel = document.getElementById('dashboardPanel');
const guildSelect = document.getElementById('guildSelect');
const saveBtn = document.getElementById('saveBtn');
const reloadBtn = document.getElementById('reloadBtn');

const fields = {
    welcomeChannelId: document.getElementById('welcomeChannelId'),
    goodbyeChannelId: document.getElementById('goodbyeChannelId'),
    birthdayChannelId: document.getElementById('birthdayChannelId'),
    birthdayRoleId: document.getElementById('birthdayRoleId'),
    ticketChannelId: document.getElementById('ticketChannelId'),
    modRoleId: document.getElementById('modRoleId'),
    wordsFilter: document.getElementById('wordsFilter'),
    websFilter: document.getElementById('websFilter')
};

async function request(url, options = {}) {
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    if (!res.ok) {
        let details = '';
        try {
            details = JSON.stringify(await res.json());
        } catch {
            details = await res.text();
        }
        throw new Error(`${res.status} ${res.statusText} ${details}`);
    }

    return res.json();
}

function setStatus(text) {
    statusEl.textContent = text;
}

function clearForm() {
    Object.values(fields).forEach((input) => {
        input.value = '';
    });
}

function fillForm(config) {
    fields.welcomeChannelId.value = config.welcomeChannelId || '';
    fields.goodbyeChannelId.value = config.goodbyeChannelId || '';
    fields.birthdayChannelId.value = config.birthdayChannelId || '';
    fields.birthdayRoleId.value = config.birthdayRoleId || '';
    fields.ticketChannelId.value = config.ticketChannelId || '';
    fields.modRoleId.value = config.modRoleId || '';
    fields.wordsFilter.value = Array.isArray(config.wordsFilter) ? config.wordsFilter.join('\n') : '';
    fields.websFilter.value = Array.isArray(config.websFilter) ? config.websFilter.join('\n') : '';
}

async function loadGuilds() {
    const data = await request('/api/dashboard/guilds');
    const guilds = data.guilds || [];

    guildSelect.innerHTML = '';
    for (const guild of guilds) {
        const option = document.createElement('option');
        option.value = guild.id;
        option.textContent = guild.name;
        guildSelect.appendChild(option);
    }

    if (guilds.length === 0) {
        clearForm();
        setStatus('No tienes servidores administrables con el bot.');
        return;
    }

    await loadSelectedGuildConfig();
}

async function loadSelectedGuildConfig() {
    const guildId = guildSelect.value;
    if (!guildId) {
        clearForm();
        return;
    }

    const data = await request(`/api/dashboard/config/${guildId}`);
    fillForm(data.config || {});
    setStatus('Configuración cargada.');
}

async function saveConfig() {
    const guildId = guildSelect.value;
    if (!guildId) {
        setStatus('Selecciona un servidor.');
        return;
    }

    const payload = {
        welcomeChannelId: fields.welcomeChannelId.value,
        goodbyeChannelId: fields.goodbyeChannelId.value,
        birthdayChannelId: fields.birthdayChannelId.value,
        birthdayRoleId: fields.birthdayRoleId.value,
        ticketChannelId: fields.ticketChannelId.value,
        modRoleId: fields.modRoleId.value,
        wordsFilter: fields.wordsFilter.value,
        websFilter: fields.websFilter.value
    };

    await request(`/api/dashboard/config/${guildId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });

    setStatus('Configuración guardada correctamente.');
}

async function bootstrap() {
    try {
        const me = await request('/api/auth/me');
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        panel.classList.remove('hidden');
        setStatus(`Sesión iniciada como ${me.username}`);
        await loadGuilds();
    } catch {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        panel.classList.add('hidden');
        setStatus('No hay sesión activa. Inicia con Discord.');
    }
}

loginBtn.addEventListener('click', () => {
    window.location.href = '/auth/discord';
});

logoutBtn.addEventListener('click', async () => {
    try {
        await request('/api/auth/logout', { method: 'POST' });
    } catch {
    }
    await bootstrap();
});

guildSelect.addEventListener('change', async () => {
    try {
        await loadSelectedGuildConfig();
    } catch (error) {
        setStatus(`Error al cargar configuración: ${error.message}`);
    }
});

saveBtn.addEventListener('click', async () => {
    try {
        await saveConfig();
    } catch (error) {
        setStatus(`Error al guardar: ${error.message}`);
    }
});

reloadBtn.addEventListener('click', async () => {
    try {
        await loadSelectedGuildConfig();
    } catch (error) {
        setStatus(`Error al recargar: ${error.message}`);
    }
});

bootstrap();
