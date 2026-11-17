(function () {
    var yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    var chip = document.getElementById('session-chip');
    var chipName = document.getElementById('session-name');
    var chipAvatar = document.getElementById('session-avatar');
    var ctaLabels = document.querySelectorAll('[data-cta-label]');

    function markLoggedIn(me) {
        var loginLinks = document.querySelectorAll('a[href="/auth/discord"]');
        for (var i = 0; i < loginLinks.length; i++) {
            loginLinks[i].setAttribute('href', '/dashboard');
        }

        for (var j = 0; j < ctaLabels.length; j++) {
            ctaLabels[j].textContent = 'Abrir dashboard';
        }

        if (chip && chipName) {
            chipName.textContent = me.username || 'Mi cuenta';
            if (chipAvatar && me.avatar && me.id) {
                chipAvatar.src = 'https://cdn.discordapp.com/avatars/' +
                    encodeURIComponent(me.id) + '/' +
                    encodeURIComponent(me.avatar) + '.png?size=32';
                chipAvatar.hidden = false;
            }
            chip.hidden = false;
        }
    }

    if (ctaLabels.length) {
        fetch('/api/auth/me', {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (me) {
                if (me && me.id) {
                    markLoggedIn(me);
                }
            })
            .catch(function () {
                // Sin sesión: la landing sigue mostrando el CTA de login.
            });
    }
})();