(function () {
    function mostrarToast(id, retraso) {
        const el = document.getElementById(id);
        if (!el || !window.bootstrap || !bootstrap.Toast) return;
        const instancia = bootstrap.Toast.getOrCreateInstance(el, { delay: retraso || 4000 });
        setTimeout(() => instancia.show(), 50);
    }

    function establecerBandera(clave) {
        try {
            sessionStorage.setItem(clave, '1');
        } catch (e) {
            console.warn('No se pudo guardar el estado del toast:', e);
        }
    }

    function consumirBandera(clave, idToast, retraso) {
        try {
            if (sessionStorage.getItem(clave) === '1') {
                sessionStorage.removeItem(clave);
                mostrarToast(idToast, retraso);
            }
        } catch (e) {
            console.warn('No se pudo leer el estado del toast:', e);
        }
    }

    window.memoToasts = {
        mostrar: mostrarToast,
        establecerBandera: establecerBandera
    };

    document.addEventListener('DOMContentLoaded', function () {
        consumirBandera('toast_registro_ok', 'toastRegistroOk', 4000);
        consumirBandera('toast_login_ok', 'toastLoginOk', 4000);
        consumirBandera('toast_logout_ok', 'toastLogoutOk', 4000);
        consumirBandera('toast_reset_ok', 'toastResetOk', 4000);
        consumirBandera('toast_eliminar_ok', 'toastCuentaEliminada', 4000);

        try {
            const params = new URLSearchParams(window.location.search);
            const q = params.get('toast');
            const mapa = {
                registro: 'toastRegistroOk',
                login: 'toastLoginOk',
                logout: 'toastLogoutOk',
                reset: 'toastResetOk',
                avatar: 'toastAvatarGuardado',
                eliminar: 'toastCuentaEliminada'
            };
            if (q && mapa[q]) {
                mostrarToast(mapa[q], 4000);
                params.delete('toast');
                const nuevaUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
                window.history.replaceState({}, '', nuevaUrl);
            }
        } catch (e) {
            console.warn('No se pudo leer el query param de toast:', e);
        }
    });
})();
