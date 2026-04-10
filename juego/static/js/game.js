let categoriaId = null;
let categoriaLabel = '';
let intentosMax = 0;
let tiempoLimite = 0;
let intentosRestantes = 0;

let primeraCarta = null;
let segundaCarta = null;
let turnoActivo = true;
let paresEncontrados = 0;
let totalPares = 0;
let movimientos = 0;
let segundos = 0;
let timerActivo = false;
let intervaloTimer;
let modalGanaste = null;
let modalPerdisteIntentos = null;
let modalPerdisteTiempo = null;
let modalAbandonar = null;

let urlPendienteAbandono = null;

let seleccionEnModal = false;

let musicaFondo = null;

/**
 * La función `reproducirMusicaFondo` reproduce música de fondo con un archivo especificado y nivel de volumen,
 * en bucle continuo.
 * @param archivo - El parámetro `archivo` en la función `reproducirMusicaFondo` representa el nombre
 * o ruta del archivo de música que deseas reproducir como música de fondo. Se utiliza para cargar dinámicamente
 * y reproducir el archivo de música especificado para la reproducción de fondo.
 */
function reproducirMusicaFondo(archivo) {
    if (musicaFondo) {
        musicaFondo.pause();
        musicaFondo = null;
    }
    musicaFondo = new Audio(`/static/music/${archivo}`);
    musicaFondo.loop = true;
    musicaFondo.volume = 0.4;
    musicaFondo.play();
}

/**
 * La función `detenerMusicaFondo` detiene la música de fondo si está reproduciéndose actualmente.
 */
function detenerMusicaFondo() {
    if (musicaFondo) {
        musicaFondo.pause();
        musicaFondo = null;
    }
}

/**
 * La función `reproducirSonido` reproduce un archivo de sonido ubicado en el directorio `/static/music/`.
 * @param archivo - El parámetro `archivo` en la función `reproducirSonido` es una cadena que
 * representa el nombre del archivo de sonido que se va a reproducir.
 */
function reproducirSonido(archivo) {
    const audio = new Audio(`/static/music/${archivo}`);
    audio.play();
}

/**
 * La función `hayPartidaEnCurso` verifica si hay un temporizador activo y una categoría seleccionada en un
 * programa de JavaScript.
 * @returns La función `hayPartidaEnCurso()` está devolviendo un valor booleano basado en las condiciones
 * `timerActivo` y `categoriaId`. Si `timerActivo` es true y `categoriaId` no es null, la
 * función devolverá `true`, indicando que hay una sesión de juego en curso. De lo contrario, devolverá
 * `false`.
 */
function hayPartidaEnCurso() {
    return timerActivo && categoriaId !== null;
}

/**
 * La función `pedirConfirmacionAbandono` muestra un modal para confirmar salir de una página y detiene un
 * temporizador si está activo.
 * @param [urlDestino=null] - El parámetro `urlDestino` es una variable que representa la URL de destino
 * donde el usuario será redirigido después de confirmar la acción de abandono. Es opcional y
 * por defecto es `null` si no se proporciona.
 */
function pedirConfirmacionAbandono(urlDestino = null) {
    urlPendienteAbandono = urlDestino;
    if (!modalAbandonar) {
        modalAbandonar = new bootstrap.Modal(document.getElementById('modalAbandonar'));
    }
    clearInterval(intervaloTimer);
    timerActivo = false;
    turnoActivo = false;
    modalAbandonar.show();
}

/**
 * La función `confirmarAbandono` maneja las acciones cuando un usuario confirma abandonar un juego, incluyendo
 * ocultar un modal, detener un temporizador, guardar el progreso del juego y redirigir a una nueva URL o restablecer
 * el estado del juego.
 */
function confirmarAbandono() {
    modalAbandonar.hide();

    clearInterval(intervaloTimer);
    timerActivo = false;

    detenerMusicaFondo();
    guardarPartida('Abandonada', 0);

    if (urlPendienteAbandono) {
        const url = urlPendienteAbandono;
        urlPendienteAbandono = null;
        setTimeout(() => { window.location.href = url; }, 300);
    } else {
        urlPendienteAbandono = null;
        resetearEstadoJuego();
        setTimeout(() => cargarCategorias(), 300);
    }
}

/**
 * La función `cancelarAbandono` oculta un modal, restablece una variable de URL y inicia una cuenta regresiva de temporizador
 * si se cumple una condición.
 */
function cancelarAbandono() {
    modalAbandonar.hide();
    urlPendienteAbandono = null;

    if (categoriaId !== null && !timerActivo) {
        timerActivo = true;
        turnoActivo = true;
        intervaloTimer = setInterval(() => {
            segundos--;
            actualizarEstadisticas();
            if (segundos <= 0) {
                segundos = 0;
                actualizarEstadisticas();
                terminarJuego('Perdida', 'tiempo');
            }
        }, 1000);
    }
}

/**
 * La función `resetearEstadoJuego` restablece todas las variables y elementos del estado del juego a sus valores
 * iniciales.
 */
function resetearEstadoJuego() {
    detenerMusicaFondo();

    categoriaId = null;
    categoriaLabel = '';
    intentosMax = 0;
    tiempoLimite = 0;
    intentosRestantes = 0;
    primeraCarta = null;
    segundaCarta = null;
    turnoActivo = true;
    paresEncontrados = 0;
    totalPares = 0;
    movimientos = 0;
    segundos = 0;
    timerActivo = false;

    clearInterval(intervaloTimer);
    document.getElementById('tablero').innerHTML = '';
    document.getElementById('categoriaLabel').textContent = '—';
    document.getElementById('miniScoreboardTitulo').innerHTML =
        '<i class="fas fa-ranking-star me-2"></i> Top de la categoría';
    document.getElementById('miniScoreboardCuerpo').innerHTML = `
        <tr>
            <td colspan="5" class="text-center" style="color: #aaa; padding: 1.2rem;">
                Elige un nivel para ver el ranking
            </td>
        </tr>`;
    actualizarEstadisticas();
}

/**
 * La función `seleccionarCategoria` configura una categoría seleccionada en un modal, actualiza algunas variables,
 * oculta el modal, carga un mini marcador, recupera cartas y reproduce música de fondo basada en el
 * nivel de la categoría.
 * @param id - El parámetro `id` en la función `seleccionarCategoria` representa el identificador único
 * de la categoría que se está seleccionando. Se utiliza para identificar la categoría dentro de la función
 * y realizar acciones específicas basadas en este identificador.
 * @param label - El parámetro `label` en la función `seleccionarCategoria` se utiliza para especificar la
 * etiqueta o nombre de la categoría que se está seleccionando. Se muestra en la página web para informar al usuario
 * sobre la categoría seleccionada.
 * @param intentos - El parámetro `intentos` en la función `seleccionarCategoria` representa el número
 * máximo de intentos o intentos permitidos para que el usuario complete una tarea o resuelva un desafío
 * dentro de la categoría seleccionada. Se utiliza para establecer la variable `intentosMax`, que almacena este
 * número máximo de intentos
 * @param tiempo - El parámetro `tiempo` en la función `seleccionarCategoria` representa el límite de tiempo
 * o restricción de tiempo para una categoría particular en un juego o aplicación. Especifica el
 * tiempo máximo permitido para que el usuario complete una tarea o actividad relacionada con esa categoría.
 */
function seleccionarCategoria(id, label, intentos, tiempo) {
    seleccionEnModal = true;
    categoriaId = id;
    categoriaLabel = label;
    intentosMax = intentos;
    tiempoLimite = tiempo;
    intentosRestantes = intentos;

    document.getElementById('categoriaLabel').textContent = label;

    bootstrap.Modal.getInstance(
        document.getElementById('modalCategoria')
    ).hide();

    cargarMiniScoreboard(id, label);
    obtenerCartas();

    const musicaPorNivel = {
        1: 'soundtrack1.ogg',
        2: 'soundtrack2.ogg',
        3: 'soundtrack3.ogg',
    };
    reproducirMusicaFondo(musicaPorNivel[id]);
}

/**
 * La función `obtenerCartas` obtiene las cartas de la categoría seleccionada desde la API y construye el tablero si la respuesta es exitosa.
 */
function obtenerCartas() {
    fetch(`/api/cartas/${categoriaId}/`)
        .then(res => res.json())
        .then(data => {
            if (data.status) {
                construirTablero(data.cartas);
            } else {
                console.error('Error al obtener cartas:', data.msg);
            }
        })
        .catch(err => console.error('Error en fetch cartas:', err));
}

/**
 * La función `construirTablero` construye el tablero de juego con las cartas proporcionadas, barajándolas y creando elementos HTML para cada carta.
 * @param cartas - El parámetro `cartas` es un arreglo de objetos que representan las cartas a incluir en el tablero.
 */
function construirTablero(cartas) {
    const tablero = document.getElementById('tablero');
    tablero.innerHTML = '';

    const cartasBarajadas = [...cartas, ...cartas]
        .sort(() => Math.random() - 0.5);

    cartasBarajadas.forEach(carta => {
        const columna = document.createElement('div');
        columna.className = 'col';

        const contenedorCarta = document.createElement('div');
        contenedorCarta.className = 'card-wrapper';

        const cartaElemento = document.createElement('div');
        cartaElemento.className = 'memory-card flipped'; 
        cartaElemento.dataset.imagen = carta.ruta_imagen;
        cartaElemento.dataset.parId = carta.par_id;

        cartaElemento.innerHTML = `
            <div class="card-front">
                <i class="fas fa-question"></i>
            </div>
            <div class="card-back">
                <img src="/static/${carta.ruta_imagen}" alt="${carta.nombre_carta}">
            </div>
        `;

        contenedorCarta.appendChild(cartaElemento);
        columna.appendChild(contenedorCarta);
        tablero.appendChild(columna);
    });

    totalPares = cartas.length;
    reiniciarEstado();
    turnoActivo = false; 

    setTimeout(() => {
        document.querySelectorAll('.memory-card').forEach(c => {
            c.classList.remove('flipped');
        });
        document.querySelectorAll('.card-wrapper').forEach(w => {
            w.onclick = voltearCarta;
        });
        turnoActivo = true;
        iniciarTimer(); 
    }, 5000);
}

/**
 * La función `voltearCarta` maneja el evento de clic en una carta, volteándola si es posible y verificando si se ha formado un par.
 */
function voltearCarta() {
    if (!turnoActivo) return;

    const cartaElemento = this.querySelector('.memory-card');
    if (cartaElemento.classList.contains('flipped') ||
        cartaElemento.classList.contains('matched')) return;

    cartaElemento.classList.add('flipped');

    if (!primeraCarta) {
        primeraCarta = cartaElemento;
    } else {
        segundaCarta = cartaElemento;
        turnoActivo = false;
        movimientos++;
        actualizarEstadisticas();
        verificarPar();
    }
}

/**
 * La función `verificarPar` verifica si las dos cartas volteadas forman un par, actualizando el estado del juego en consecuencia.
 */
function verificarPar() {
    const esPar = primeraCarta.dataset.parId === segundaCarta.dataset.parId;

    if (esPar) {
        setTimeout(() => {
            primeraCarta.classList.add('matched');
            segundaCarta.classList.add('matched');
            paresEncontrados++;
            actualizarEstadisticas();
            reiniciarCartas();
            if (paresEncontrados === totalPares) terminarJuego('Ganada');
        }, 500);
    } else {
        
        intentosRestantes--;
        actualizarEstadisticas();

        if (intentosRestantes <= 0) {
            setTimeout(() => terminarJuego('Perdida', 'intentos'), 1000);
        } else {
            setTimeout(() => {
                primeraCarta.classList.remove('flipped');
                segundaCarta.classList.remove('flipped');
                reiniciarCartas();
            }, 1000);
        }
    }
}

/**
 * La función `iniciarTimer` inicia el temporizador de cuenta regresiva para el límite de tiempo del juego.
 */
function iniciarTimer() {
    timerActivo = true;
    segundos = tiempoLimite;
    actualizarEstadisticas();

    intervaloTimer = setInterval(() => {
        segundos--;
        actualizarEstadisticas();

        if (segundos <= 0) {
            segundos = 0;
            actualizarEstadisticas();
            terminarJuego('Perdida', 'tiempo');
        }

    }, 1000);
}
/**
 * La función `actualizarEstadisticas` actualiza la visualización de las estadísticas del juego, incluyendo movimientos, pares, tiempo e intentos restantes.
 */
function actualizarEstadisticas() {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;

    document.getElementById('movimientos').textContent = movimientos;
    document.getElementById('pares').textContent = `${paresEncontrados}/${totalPares}`;
    document.getElementById('tiempo').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    document.getElementById('intentos').textContent = intentosRestantes || '—';
}
/**
 * La función `terminarJuego` finaliza el juego con el estado especificado, calcula el puntaje, guarda la partida y muestra el modal correspondiente.
 * @param estado - El parámetro `estado` indica el resultado del juego ('Ganada' o 'Perdida').
 * @param causaPerdida - El parámetro `causaPerdida` especifica la razón de la pérdida ('intentos' o 'tiempo'), por defecto 'intentos'.
 */
function terminarJuego(estado, causaPerdida = 'intentos') {
    clearInterval(intervaloTimer);
    timerActivo = false;

    const { puntaje, base, bTiempo, bMov } = calcularPuntaje(estado);

    guardarPartida(estado, puntaje);

    if (estado === 'Ganada') {
        document.getElementById('finalBase').textContent = base;
        document.getElementById('finalBonusTiempo').textContent = bTiempo;
        document.getElementById('finalBonusMov').textContent = bMov;
        document.getElementById('finalPuntaje').textContent = puntaje;

        if (!modalGanaste) {
            modalGanaste = new bootstrap.Modal(document.getElementById('modalGanaste'));
        }
        detenerMusicaFondo();
        reproducirSonido('win.ogg');
        modalGanaste.show();
    } else {
        if (causaPerdida === 'tiempo') {
            if (!modalPerdisteTiempo) {
                modalPerdisteTiempo = new bootstrap.Modal(document.getElementById('modalPerdisteTiempo'));
            }
            detenerMusicaFondo();
            reproducirSonido('timer.ogg');
            modalPerdisteTiempo.show();
        } else {
            if (!modalPerdisteIntentos) {
                modalPerdisteIntentos = new bootstrap.Modal(document.getElementById('modalPerdisteIntentos'));

            }
            detenerMusicaFondo();
            reproducirSonido('lose.ogg');
            modalPerdisteIntentos.show();
        }
    }
}
/**
 * La función `calcularPuntaje` calcula el puntaje de la partida basada en el estado del juego y los bonos aplicables.
 * @param estado - El parámetro `estado` indica si el juego fue ganado o perdido.
 * @returns Un objeto con el puntaje total, puntaje base, bono de tiempo y bono de movimientos.
 */
function calcularPuntaje(estado) {
    if (estado !== 'Ganada') return { puntaje: 0, base: 0, bTiempo: 0, bMov: 0 };

    const config = {
        6: { base: 40, bonusTiempo: 1, bonusMov: 2 },  // Básico
        4: { base: 60, bonusTiempo: 2, bonusMov: 3 },  // Medio
        2: { base: 80, bonusTiempo: 3, bonusMov: 4 },  // Avanzado
    };

    const cfg = config[intentosMax] ?? { base: 40, bonusTiempo: 1, bonusMov: 2 };
    const movimientosRef = totalPares * 2;
    const bTiempo = Math.max(0, segundos) * cfg.bonusTiempo;
    const bMov = Math.max(0, movimientosRef - movimientos) * cfg.bonusMov;
    const puntaje = cfg.base + bTiempo + bMov;

    return { puntaje, base: cfg.base, bTiempo, bMov };
}
/**
 * La función `guardarPartida` guarda los datos de la partida actual en el servidor mediante una solicitud POST.
 * @param estado - El parámetro `estado` representa el estado de la partida ('Ganada', 'Perdida', 'Abandonada').
 * @param puntaje - El parámetro `puntaje` es el puntaje obtenido en la partida.
 */
function guardarPartida(estado, puntaje) {
    const tiempoJugado = tiempoLimite - segundos;

    const formData = new FormData();
    formData.append('categoria_id', categoriaId);
    formData.append('estado', estado);
    formData.append('tiempo_jugado', tiempoJugado);
    formData.append('movimientos', movimientos);
    formData.append('intentos_realizados', intentosMax - intentosRestantes);
    formData.append('puntaje', puntaje);

    fetch('/api/guardar_partida/', {

        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (!data.status) console.error('Error al guardar partida:', data.msg);
    })
    .catch(err => console.error('Error en fetch guardar_partida:', err));
}
/**
 * La función `nuevaPartida` inicia una nueva partida, ocultando modales y verificando si hay una partida en curso para pedir confirmación.
 */
function nuevaPartida() {
    if (modalGanaste) modalGanaste.hide();

    if (modalPerdisteIntentos) modalPerdisteIntentos.hide();
    if (modalPerdisteTiempo) modalPerdisteTiempo.hide();

    clearInterval(intervaloTimer);

    if (hayPartidaEnCurso()) {
        pedirConfirmacionAbandono(null);
        return;
    }

    cargarCategorias();
}
/**
 * La función `reiniciarEstado` reinicia las variables de estado del juego para preparar una nueva ronda.
 */
function reiniciarEstado() {
    primeraCarta = null;
    segundaCarta = null;
    turnoActivo = true;
    paresEncontrados = 0;
    movimientos = 0;
    segundos = tiempoLimite; 
    timerActivo = false;
    intentosRestantes = intentosMax;
    clearInterval(intervaloTimer);
    actualizarEstadisticas();
}
/**
 * La función `reiniciarCartas` reinicia las variables relacionadas con las cartas volteadas para permitir nuevos movimientos.
 */
function reiniciarCartas() {
    primeraCarta = null;
    segundaCarta = null;
    turnoActivo = true;
}

/**
 * Event listener para 'DOMContentLoaded' que inicializa la aplicación cargando categorías y configurando
 * el manejo de clics para prevenir navegación durante una partida en curso.
 */
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();

    document.addEventListener('click', (e) => {
        if (!hayPartidaEnCurso()) return;

        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('#')) return;

        if (link.classList.contains('memo-dropdown-logout') ||
            link.closest('.memo-dropdown-logout')) return;

        e.preventDefault();
        pedirConfirmacionAbandono(href);

        history.pushState(null, '', window.location.href);

        window.addEventListener('popstate', (e) => {
            if (hayPartidaEnCurso()) {
                history.pushState(null, '', window.location.href);
                pedirConfirmacionAbandono(null);
            }
        });
    }, true); 
});
/**
 * La función `cargarCategorias` carga las categorías disponibles desde la API y las muestra en la interfaz de usuario.
 */
function cargarCategorias() {
    fetch('/api/categorias/')
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('listaCategorias');
            if (!data.status || data.categorias.length === 0) {
                lista.innerHTML = '<p class="text-center" style="color:#aaa;">No hay niveles disponibles.</p>';
                return;
            }

            const tematicas = {
                1: 'Lenguajes de programación',
                2: 'Herramientas y DevOps',
                3: 'Frameworks y librerías',
            };

            const iconosEstrellas = (n) => Array(n).fill('<i class="fas fa-star me-1"></i>').join('');

            lista.innerHTML = data.categorias.map(cat => `
                <button class="btn btn-game py-3"
                    onclick="seleccionarCategoria(${cat.id}, '${cat.nombre}', ${cat.intentos_max}, ${cat.tiempo_limite})">
                    ${iconosEstrellas(cat.id)}
                    ${cat.nombre}
                    <small class="d-block" style="font-size: 0.82em; margin-top: 0.2rem; font-weight: normal">
                        <i class="fas fa-tag me-1"></i>${tematicas[cat.id] ?? ''}
                    </small>
                    <small class="d-block" style="font-size: 0.8em; font-weight: normal">
                        ${cat.intentos_max} intentos · ${cat.tiempo_limite}s
                    </small>
                </button>
            `).join('');

            const btnIniciar = document.getElementById('btnIniciarDesdeInstrucciones');
            const modalInstr = new bootstrap.Modal(document.getElementById('modalInstrucciones'));
            const modalCat = new bootstrap.Modal(
                document.getElementById('modalCategoria'),
                { backdrop: 'static', keyboard: false }
            );

            const modalEl = document.getElementById('modalCategoria');
            modalEl.addEventListener('hidden.bs.modal', () => {
                if (!seleccionEnModal) {
                    resetearEstadoJuego();
                }
            }, { once: true });

            const instrYaAbierto = document.getElementById('modalInstrucciones').classList.contains('show');
            if (!instrYaAbierto) {
                modalInstr.show();
            }


            btnIniciar.onclick = () => {
                modalInstr.hide();
                seleccionEnModal = false;
                setTimeout(() => modalCat.show(), 400);
            };
        })
        .catch(err => {
            console.error('Error al cargar categorías:', err);
        });
}

/**
 * La función `cargarMiniScoreboard` carga y muestra el marcador de la categoría seleccionada en el mini scoreboard.
 * @param categoriaId - El parámetro `categoriaId` es el identificador de la categoría para la que se carga el marcador.
 * @param nombreCategoria - El parámetro `nombreCategoria` es el nombre de la categoría a mostrar en el título del marcador.
 */
function cargarMiniScoreboard(categoriaId, nombreCategoria) {
    const titulo = document.getElementById('miniScoreboardTitulo');
    const cuerpo = document.getElementById('miniScoreboardCuerpo');

    if (!titulo || !cuerpo) return;

    titulo.innerHTML = `<i class="fas fa-ranking-star me-2"></i> Top ${nombreCategoria}`;
    cuerpo.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                <i class="fas fa-spinner fa-spin me-2"></i> Cargando...
            </td>
        </tr>`;

    fetch('/api/scoreboard/')
        .then(res => res.json())
        .then(data => {
            if (!data.status) return;

            const filtrados = data.scoreboard
                .filter(e => e.categoria__nombre === nombreCategoria)
                .slice(0, 20);

            if (filtrados.length === 0) {
                cuerpo.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center" style="color: #aaa;">
                            Sin partidas aún.
                        </td>
                    </tr>`;
                return;
            }

            cuerpo.innerHTML = filtrados.map((entrada, i) => {

                const total = Math.max(0, Math.round(entrada.tiempo_jugado || 0));
                const mins = Math.floor(total / 60);
                const secs = total % 60;
                const tiempo = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                return `
                    <tr>
                        <td>
                            <span class="puesto-badge">${i + 1}</span>
                        </td>

                        <td>
                            <i class="fas fa-user-circle me-1" style="color: var(--sky);"></i>
                            ${entrada.usuario__nombre_usuario}
                        </td>

                        <td>
                            <i class="fas fa-medal me-1"></i>
                            ${entrada.usuario__rango__nombre ?? 'Sin Rango'}
                        </td>

                        <td>
                            <strong>${entrada.puntaje}</strong> pts
                        </td>

                        <td>
                            <i class="fas fa-clock me-1" style="color: var(--mint);"></i>
                            ${tiempo}
                        </td>
                    </tr>
                `;
            }).join('');
        })
        .catch(err => console.error('Error en mini scoreboard:', err));
}