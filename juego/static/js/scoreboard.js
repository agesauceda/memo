let tabActiva = 'global';
let datosScoreboard = [];

function formatearTiempoMMSS(segundosRaw) {
    const total = Math.max(0, Math.round(segundosRaw || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

document.addEventListener('DOMContentLoaded', () => {
    cargarScoreboard();
});

function cargarScoreboard() {
    fetch('/api/scoreboard/')
        .then(res => res.json())
        .then(data => {
            if (data.status) {
                datosScoreboard = data.scoreboard;
                renderizarTabla('global');
                renderizarPodio('global');
            } else {
                console.error('Error al cargar scoreboard:', data.msg);
            }
        })
        .catch(err => console.error('Error en fetch scoreboard:', err));
}

function cambiarTab(btn, categoria) {
    tabActiva = categoria;

    document.querySelectorAll('.sb-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    renderizarTabla(categoria);
    renderizarPodio(categoria);
}

function filtrarDatos(categoria) {
    if (categoria === 'global') {
        return [...datosScoreboard].sort((a, b) => b.puntaje - a.puntaje);
    }
    return datosScoreboard
        .filter(e => e.categoria__nombre === categoria)
        .sort((a, b) => b.puntaje - a.puntaje);
}

function renderizarPodio(categoria) {
    const datos = filtrarDatos(categoria).slice(0, 3);

    // visual: 2° | 1° | 3°
    // datos[0]=1er lugar → podium-2 (centro HTML)
    // datos[1]=2do lugar → podium-1 (izquierda HTML)  
    // datos[2]=3er lugar → podium-3 (derecha HTML)
    const mapa = [
    { podiumId: 1, dataIdx: 0 },  // centro con corona = 1° lugar → datos[0]
    { podiumId: 2, dataIdx: 1 },  // izquierda = 2° lugar → datos[1]
    { podiumId: 3, dataIdx: 2 },  // derecha = 3° lugar → datos[2]
];

    mapa.forEach(({ podiumId, dataIdx }) => {
        const entrada = datos[dataIdx];
        const nombre = document.getElementById(`podium${podiumId}-nombre`);
        const cat = document.getElementById(`podium${podiumId}-cat`);
        const puntaje = document.getElementById(`podium${podiumId}-puntaje`);
        const avatarEl = document.querySelector(`.podium-${podiumId} .podium-avatar`);

        if (entrada) {
            nombre.textContent = entrada.usuario__nombre_usuario;
            cat.textContent = entrada.categoria__nombre;
            puntaje.textContent = `${entrada.puntaje} pts`;
            if (avatarEl) {
                if (entrada.usuario__avatar) {
                    const url = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${entrada.usuario__nombre_usuario}&${entrada.usuario__avatar}&rotate=0&scale=100&backgroundType=solid&radius=0&size=80`;
                    avatarEl.innerHTML = `<img src="${url}" alt="avatar" style="width:100%; height:100%; border-radius:50%; display:block; object-fit:cover;">`;
                } else {
                    avatarEl.innerHTML = `<i class="fas fa-user"></i>`;
                }
            }
        } else {
            nombre.textContent = '—';
            cat.textContent = '—';
            puntaje.textContent = '—';
            if (avatarEl) avatarEl.innerHTML = `<i class="fas fa-user"></i>`;
        }
    });
}

function renderizarTabla(categoria) {
    const datos = filtrarDatos(categoria);
    const cuerpo = document.getElementById('cuerpoTabla');
    const encabezado = document.getElementById('encabezadoTabla');

    const etiqueta = categoria === 'global' ? 'Global' : categoria;
    encabezado.innerHTML = `<i class="fas fa-list-ol me-2"></i> ${etiqueta} — Top jugadores`;

    if (datos.length === 0) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="color: #aaa;">
                    No hay partidas registradas aún.
                </td>
            </tr>`;
        return;
    }

    cuerpo.innerHTML = datos.map((entrada, i) => {
        const clasesFila = i === 0 ? 'row-first' : i === 1 ? 'row-second' : i === 2 ? 'row-third' : '';
        const mins = Math.floor(entrada.tiempo_jugado / 60);
        const secs = entrada.tiempo_jugado % 60;
        const tiempo = formatearTiempoMMSS(entrada.tiempo_jugado);


        return `
            <tr class="${clasesFila}">
                <td class="col-puesto">
                    <span class="puesto-badge">${i + 1}</span>
                </td>
                <td class="col-jugador">
                    ${entrada.usuario__avatar
                        ? `<img src="https://api.dicebear.com/9.x/fun-emoji/svg?seed=${entrada.usuario__nombre_usuario}&${entrada.usuario__avatar}&rotate=0&scale=100&backgroundType=solid&radius=0&size=28" 
                            style="width:28px; height:28px; border-radius:50%; vertical-align:middle; margin-right:6px;">`
                        : `<i class="fas fa-user-circle me-2" style="color: var(--sky);"></i>`
                    }
                    ${entrada.usuario__nombre_usuario}
                </td>
                <td class="col-categoria">
                    <span class="cat-badge cat-${entrada.categoria__nombre.toLowerCase()}">
                        ${entrada.categoria__nombre}
                    </span>
                </td>
                <td class="col-rango">
                    <span class="rango-badge">
                        <i class="fas fa-medal me-1"></i>
                        ${entrada.usuario__rango__nombre ?? 'Sin Rango'}
                    </span>
                </td>
                <td class="col-puntaje">
                    <strong>${entrada.puntaje}</strong> pts
                </td>
                <td class="col-tiempo">
                    <i class="fas fa-clock me-1" style="color: var(--mint);"></i>
                    ${tiempo}
                </td>
            </tr>`;
    }).join('');
}

function cargarMiniScoreboard(categoria, nombreCategoria) {
    const titulo = document.getElementById('miniScoreboardTitulo');
    const cuerpo = document.getElementById('miniScoreboardCuerpo');

    if (!titulo || !cuerpo) return;

    titulo.innerHTML = `<i class="fas fa-ranking-star me-2"></i> Top ${nombreCategoria}`;
    cuerpo.innerHTML = `
        <tr>
            <td colspan="3" class="text-center">
                <i class="fas fa-spinner fa-spin me-2"></i> Cargando...
            </td>
        </tr>`;

    fetch('/api/scoreboard/')
        .then(res => res.json())
        .then(data => {
            if (!data.status) return;

            const filtrados = data.scoreboard
                .filter(e => e.categoria__nombre === nombreCategoria)
                .slice(0, 5);

            if (filtrados.length === 0) {
                cuerpo.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center" style="color: #aaa;">
                            Sin partidas aún.
                        </td>
                    </tr>`;
                return;
            }

            cuerpo.innerHTML = filtrados.map((entrada, i) => `
                <tr>
                    <td><span class="puesto-badge">${i + 1}</span></td>
                    <td>
                        <i class="fas fa-user-circle me-1" style="color: var(--sky);"></i>
                        ${entrada.usuario__nombre_usuario}
                    </td>
                    <td><strong>${entrada.puntaje}</strong> pts</td>
                </tr>
            `).join('');
        })
        .catch(err => console.error('Error en mini scoreboard:', err));
}