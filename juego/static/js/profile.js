
let paginaActual = 1;
let _usuarioActual = null; 

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil(1);
    const btnEliminar = document.getElementById('btnConfirmarEliminarCuenta');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', eliminarCuenta);
    }
});

function cargarPerfil(page) {
    paginaActual = page;
    fetch(`/api/perfil/?page=${page}`)
        .then(res => res.json())
        .then(data => {
            if (data.status) {
                if (page === 1) {
                    _usuarioActual = data.usuario;
                    renderizarPerfil(data.usuario, data.estadisticas);
                }
                renderizarHistorial(data.historial);
                renderizarPaginacion(data.paginacion);
            } else {
                console.error('Error al cargar perfil:', data.msg);
            }
        })
        .catch(err => console.error('Error en fetch perfil:', err));
}

function renderizarPerfil(usuario, stats) {
    document.getElementById('nombreUsuario').textContent = usuario.nombre_usuario;
    document.getElementById('fechaRegistro').textContent = usuario.fecha_registro || '—';
    document.getElementById('statVictorias').textContent = stats.total_victorias;
    document.getElementById('statDerrotas').textContent = stats.total_derrotas;
    document.getElementById('statPartidas').textContent = stats.total_partidas;
    document.getElementById('statCategoria').textContent = stats.categoria_mas_jugada;

    aplicarAvatarEnPerfil(usuario.nombre_usuario, usuario.avatar);

    const promedioSecs = Math.round(stats.promedio_tiempo);
    const mins = Math.floor(promedioSecs / 60);
    const secs = promedioSecs % 60;
    document.getElementById('statPromedioTiempo').textContent =
        `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function aplicarAvatarEnPerfil(nombreUsuario, avatarParams) {
    const avatarEl = document.getElementById('avatarPerfil');
    if (avatarParams) {
        const url = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${nombreUsuario}&${avatarParams}&rotate=0&scale=100&backgroundType=solid&radius=0&size=100`;
        avatarEl.innerHTML = `<img src="${url}" alt="avatar" style="width:100%; height:100%; border-radius:50%; display:block; object-fit:cover;">`;
    } else {
        avatarEl.innerHTML = `<i class="fas fa-user"></i>`;
    }
}

function abrirEditorAvatar() {
    if (!_usuarioActual) return;

    avatarPicker.initEdicion(
        _usuarioActual.avatar,
        _usuarioActual.nombre_usuario,
        function onConfirmar(state) {
            guardarAvatarEnServidor(state);
        }
    );

    avatarPicker.abrir();
}

function guardarAvatarEnServidor(state) {
    const nuevoAvatar = avatarPicker.buildParams();

    fetch('/api/actualizar_avatar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `avatar=${encodeURIComponent(nuevoAvatar)}`
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {

            _usuarioActual.avatar = nuevoAvatar;
            aplicarAvatarEnPerfil(_usuarioActual.nombre_usuario, nuevoAvatar);
            mostrarToastAvatar();
            const seed = _usuarioActual.nombre_usuario;
            const urlBtn = avatarPicker.buildUrl(seed, 40);
            const urlDropdown = avatarPicker.buildUrl(seed, 48);

            const navBtn = document.getElementById('navAvatarBtn');
            const navDropdown = document.getElementById('navAvatarDropdown');
            if (navBtn) navBtn.src = urlBtn;
            if (navDropdown) navDropdown.src = urlDropdown;
        } else {
            console.error('Error al guardar avatar:', data.msg);
        }
    })
    .catch(err => console.error('Error en fetch actualizar_avatar:', err));
}

function mostrarToastAvatar() {
    if (window.memoToasts && typeof window.memoToasts.mostrar === 'function') {
    window.memoToasts.mostrar('toastAvatarGuardado', 4000);
        return;
    }
    const toast = document.getElementById('toastAvatarGuardado');
    if (!toast || !window.bootstrap) return;
    bootstrap.Toast.getOrCreateInstance(toast, { delay: 4000 }).show();
}

function renderizarHistorial(historial) {
    const cuerpo = document.getElementById('cuerpoHistorial');

    if (historial.length === 0) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="color: #aaa;">
                    Aún no has jugado ninguna partida.
                </td>
            </tr>`;
        return;
    }

    const offset = (paginaActual - 1) * 15;

    cuerpo.innerHTML = historial.map((partida, i) => {
        const mins = Math.floor(partida.tiempo_jugado / 60);
        const secs = partida.tiempo_jugado % 60;
        const tiempo = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        const fecha = partida.fecha_partida || '—';
        const estadoBadge = obtenerBadgeEstado(partida.estado);

        return `
            <tr>
                <td class="col-partida">
                    <span class="puesto-badge">${offset + i + 1}</span>
                </td>
                <td class="col-categoria">
                    <span class="cat-badge cat-${partida.categoria__nombre.toLowerCase()}">
                        ${partida.categoria__nombre}
                    </span>
                </td>
                <td class="col-puntaje">
                    <i class="fas fa-star me-1" style="color: var(--peach);"></i>
                    ${partida.puntaje > 0 ? partida.puntaje : '—'}
                </td>
                <td class="col-tiempo">
                    <i class="fas fa-clock me-1" style="color: var(--mint);"></i>
                    ${tiempo}
                </td>
                <td class="col-estado">${estadoBadge}</td>
                <td class="col-fecha">${fecha}</td>
            </tr>`;
    }).join('');
}

function renderizarPaginacion(paginacion) {
    const { page, total_paginas, total_partidas, por_pagina } = paginacion;

    let contenedor = document.getElementById('paginacionHistorial');
    if (!contenedor) {
        const sbCard = document.querySelector('.sb-card');
        contenedor = document.createElement('div');
        contenedor.id = 'paginacionHistorial';
        sbCard.appendChild(contenedor);
    }

    if (total_paginas <= 1) {
        contenedor.innerHTML = '';
        return;
    }

    const desde = (page - 1) * por_pagina + 1;
    const hasta = Math.min(page * por_pagina, total_partidas);

    let paginas = [];
    for (let p = 1; p <= total_paginas; p++) {
        if (p === 1 || p === total_paginas || (p >= page - 2 && p <= page + 2)) {
            paginas.push(p);
        }
    }

    let botonesHtml = '';
    let anterior = null;
    for (const p of paginas) {
        if (anterior !== null && p - anterior > 1) {
            botonesHtml += `<span class="pagination-dots">…</span>`;
        }
        if (p === page) {
            botonesHtml += `<button class="pagination-btn active" disabled>${p}</button>`;
        } else {
            botonesHtml += `<button class="pagination-btn" onclick="cargarPerfil(${p})">${p}</button>`;
        }
        anterior = p;
    }

    contenedor.innerHTML = `
        <div class="pagination-wrap">
            <span class="pagination-info">
                Mostrando ${desde}–${hasta} de ${total_partidas} partidas
            </span>
            <div class="pagination-controls">
                <button class="pagination-btn pagination-arrow"
                    onclick="cargarPerfil(${page - 1})"
                    ${page === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                ${botonesHtml}
                <button class="pagination-btn pagination-arrow"
                    onclick="cargarPerfil(${page + 1})"
                    ${page === total_paginas ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>`;

    if (page > 1) {
        document.querySelector('.sb-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function obtenerBadgeEstado(estado) {
    const estados = {
        'Ganada': { cls: 'status-win', icono: 'fas fa-crown', label: 'Victoria' },
        'Perdida': { cls: 'status-loss', icono: 'fas fa-circle-xmark', label: 'Derrota' },
        'Abandonada': { cls: 'status-abandoned', icono: 'fas fa-person-running', label: 'Abandonada' },
    };
    const info = estados[estado] || { cls: '', icono: 'fas fa-question', label: estado };
    return `<span class="status-badge ${info.cls}">
                <i class="${info.icono} me-1"></i>${info.label}
            </span>`;
}

function eliminarCuenta() {
    fetch('/api/eliminar_cuenta/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: ''
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            try {
                sessionStorage.setItem('toast_eliminar_ok', '1');
            } catch (e) {
                console.warn('No se pudo guardar el estado del toast:', e);
            }
            window.location.href = data.redirect_url || '/';
        } else {
            alert(data.msg || 'No se pudo eliminar la cuenta.');
        }
    })
    .catch(err => {
        console.error('Error en eliminar_cuenta:', err);
        alert('Ocurrio un error al eliminar la cuenta.');
    });
}
