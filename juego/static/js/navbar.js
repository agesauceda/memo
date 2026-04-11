function alternarDropdown() {
        /*
        Función encargada de alternar la visibilidad del menú desplegable (dropdown)
        asociado al avatar del usuario en la barra de navegación.
        Utiliza la clase CSS 'open' para mostrar u ocultar el elemento.
    */
    const dropdown = document.getElementById('avatarDropdown');
    dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
        /*
        Evento global que detecta clics en cualquier parte del documento.
        Su propósito es cerrar el dropdown si el usuario hace clic fuera
        del contenedor del avatar.
    */
    const contenedor = document.getElementById('avatarWrap');
    if (contenedor && !contenedor.contains(e.target)) {
        document.getElementById('avatarDropdown').classList.remove('open');
    }
});

function alternarMenuMobile() {
      /*
        Controla la apertura y cierre del menú de navegación en dispositivos móviles.
        Alterna la clase 'open' tanto en el menú como en el botón tipo hamburger,
        permitiendo aplicar estilos dinámicos.
    */
    const menu = document.getElementById('mobileMenu');
    const btn = document.getElementById('hamburgerBtn');
    menu.classList.toggle('open');
    btn.classList.toggle('open');
}

function cerrarSesion() {
      /*
        Gestiona el proceso de cierre de sesión del usuario.
        Incluye validación de partida activa, comunicación con el servidor
        y redirección posterior.
    */
    if (typeof hayPartidaEnCurso === 'function' && hayPartidaEnCurso()) {
        clearInterval(intervaloTimer);
        timerActivo = false;
        guardarPartida('Abandonada', 0);
    }

    const formData = new FormData();
    
    /*
        Se adjunta el identificador de sesión si está disponible,
        permitiendo al backend identificar correctamente al usuario.
    */
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
    /*
        Función autoejecutable  que implementa un sistema de cierre de sesión
        automático por inactividad del usuario.
    */
    const TIEMPO_LIMITE = 15 * 60 * 1000;
    let temporizador;

    function ejecutarLogoutPorInactividad() {
    /*
      Procedimiento ejecutado cuando se supera el tiempo de inactividad.
       Realiza acciones similares al cierre de sesión manual.
        */
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
    /*
       Reinicia el temporizador de inactividad cada vez que el usuario
       interactúa con la página.
        */
        clearTimeout(temporizador);
        temporizador = setTimeout(ejecutarLogoutPorInactividad, TIEMPO_LIMITE);
    }
  /*
        Eventos que se consideran como actividad del usuario.
        Cada uno reinicia el temporizador.
    */
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evento => {
        document.addEventListener(evento, reiniciarTimer, { passive: true });
    });
    /*
        Inicialización del temporizador al cargar el script.
    */
    reiniciarTimer();
})();
