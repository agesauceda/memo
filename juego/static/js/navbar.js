function alternarDropdown() {
    const dropdown = document.getElementById('avatarDropdown');
    dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
    const contenedor = document.getElementById('avatarWrap');
    if (contenedor && !contenedor.contains(e.target)) {
        document.getElementById('avatarDropdown').classList.remove('open');
    }
});

function alternarMenuMobile() {
    const menu = document.getElementById('mobileMenu');
    const btn = document.getElementById('hamburgerBtn');
    menu.classList.toggle('open');
    btn.classList.toggle('open');
}

function cerrarSesion() {
    if (typeof hayPartidaEnCurso === 'function' && hayPartidaEnCurso()) {
        clearInterval(intervaloTimer);
        timerActivo = false;
        guardarPartida('Abandonada', 0);
    }

    const formData = new FormData();
    if (typeof SESION_ID !== 'undefined' && SESION_ID) {
        formData.append('sesion_id', SESION_ID);
    }

    fetch('/api/logout/', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            try {
                sessionStorage.setItem('toast_logout_ok', '1');
            } catch (e) {
                console.warn('No se pudo guardar el estado de logout:', e);
            }
            try {
                const url = new URL(data.redirect_url, window.location.origin);
                url.searchParams.set('toast', 'logout');
                window.location.href = url.toString();
            } catch (e) {
                window.location.href = data.redirect_url;
            }
        }
    })
    .catch(err => console.error('Error al cerrar sesión:', err));
}

document.addEventListener('DOMContentLoaded', () => {
    const ruta = window.location.pathname;

    document.querySelectorAll('.memo-nav-link').forEach(link => {
        link.classList.remove('active');
    });

    if (ruta === '/juego/') document.getElementById('nav-inicio')?.classList.add('active');
    if (ruta === '/scoreboard/') document.getElementById('nav-scoreboard')?.classList.add('active');
});

(function () {
    const TIEMPO_LIMITE = 15 * 60 * 1000;
    let temporizador;

    function ejecutarLogoutPorInactividad() {
        if (typeof hayPartidaEnCurso === 'function' && hayPartidaEnCurso()) {
            clearInterval(intervaloTimer);
            timerActivo = false;
            guardarPartida('Abandonada', 0);
        }
        const formData = new FormData();
        if (typeof SESION_ID !== 'undefined' && SESION_ID) {
            formData.append('sesion_id', SESION_ID);
        }
        fetch('/api/logout/', { method: 'POST', body: formData })
            .finally(() => {
                try {
                    sessionStorage.setItem('toast_logout_ok', '1');
                } catch (e) {
                    console.warn('No se pudo guardar el estado de logout:', e);
                }
                try {
                    const url = new URL('/', window.location.origin);
                    url.searchParams.set('toast', 'logout');
                    window.location.href = url.toString();
                } catch (e) {
                    window.location.href = '/';
                }
            });
    }

    function reiniciarTimer() {
        clearTimeout(temporizador);
        temporizador = setTimeout(ejecutarLogoutPorInactividad, TIEMPO_LIMITE);
    }

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evento => {
        document.addEventListener(evento, reiniciarTimer, { passive: true });
    });

    reiniciarTimer();
})();
