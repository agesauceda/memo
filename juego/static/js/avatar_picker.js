const AVATAR_BASE_URL = 'https://api.dicebear.com/9.x/fun-emoji/svg';

const AVATAR_COLORS = [
    { hex: 'FFA07A', name: 'Peach'       },
    { hex: 'F28B82', name: 'Coral'       },
    { hex: 'E05C5C', name: 'Rojo suave'  },
    { hex: 'F4A7B9', name: 'Rosa claro'  },
    { hex: 'E8638C', name: 'Rosa fuerte' },
    { hex: 'B5A9E0', name: 'Lavender'    },
    { hex: '9B7FD4', name: 'Violeta'     },
    { hex: '7B5EA7', name: 'Uva'         },
    { hex: '87CEEB', name: 'Sky'         },
    { hex: '90B4E8', name: 'Periwinkle'  },
    { hex: '4A90D9', name: 'Azul medio'  },
    { hex: '2E6BAD', name: 'Azul oscuro' },
    { hex: '98D8C8', name: 'Mint'        },
    { hex: 'A8D8A8', name: 'Sage'        },
    { hex: '5BAD72', name: 'Verde medio' },
    { hex: '2E7D52', name: 'Verde oscuro'},
    { hex: 'F6E27A', name: 'Amarillo'    },
    { hex: 'FFD580', name: 'Mango'       },
    { hex: 'F7B267', name: 'Amber'       },
    { hex: 'D4A017', name: 'Mostaza'     },
];

const AVATAR_EYES = [
    'closed', 'closed2', 'crying', 'cute', 'glasses',
    'love', 'pissed', 'plain', 'sad', 'shades',
    'sleepClose', 'stars', 'tearDrop', 'wink', 'wink2'
];

const AVATAR_MOUTHS = [
    'cute', 'drip', 'faceMask', 'kissHeart', 'lilSmile',
    'pissed', 'plain', 'sad', 'shout', 'shy',
    'sick', 'smileLol', 'smileTeeth', 'tongueOut', 'wideSmile'
];

const STEP_LABELS = [
    'Paso 1 - Elige el color de fondo',
    'Paso 2 - Elige los ojos',
    'Paso 3 - Elige la boca',
];

const avatarPicker = {

    state: {
        bgColor: 'FFA07A',
        eyes: 'wink',
        mouth: 'cute',
        saved: false,
    },

    modo: 'registro',

    getSeed: function () { return 'memo'; },

    onConfirmar: null,

    onAbandonar: null,

    _paso: 1,

    /**
     * Configura el picker para modo REGISTRO.
     * @param {Function} getSeedFn  Función que devuelve el seed (ej: () => username.value)
     * @param {Function} onConfirmar Callback cuando guarda el avatar
     * @param {Function} onAbandonar Callback cuando sale sin guardar
     */

    initRegistro: function (getSeedFn, onConfirmar, onAbandonar) {
        this.modo = 'registro';
        this.getSeed = getSeedFn;
        this.onConfirmar = onConfirmar;
        this.onAbandonar = onAbandonar;
        this.state.saved = false;

        const titulo = document.getElementById('avatarPickerTitulo');
        const subAbandono = document.getElementById('abandonarSubtitulo');
        if (titulo) titulo.textContent = 'Personaliza tu avatar';
        if (subAbandono) subAbandono.innerHTML = 'Si sales ahora, se asignará un avatar aleatorio.<br>';
    },

    /**
     * Configura el picker para modo EDICIÓN.
     * @param {string}   avatarParams String de parámetros actuales del usuario (ej: 'eyes=wink&mouth=cute&backgroundColor=FFA07A')
     * @param {string}   seed         Username del usuario
     * @param {Function} onConfirmar  Callback cuando guarda con { bgColor, eyes, mouth }
     */

    initEdicion: function (avatarParams, seed, onConfirmar) {
        this.modo = 'edicion';
        this.getSeed = () => seed;
        this.onConfirmar = onConfirmar;
        this.onAbandonar = null;

        if (avatarParams) {
            const params = new URLSearchParams(avatarParams);
            this.state.bgColor = params.get('backgroundColor') || 'FFA07A';
            this.state.eyes = params.get('eyes') || 'wink';
            this.state.mouth = params.get('mouth') || 'cute';
        }
        this.state.saved = false;

        const titulo = document.getElementById('avatarPickerTitulo');
        const subAbandono = document.getElementById('abandonarSubtitulo');
        const btnAbandono = document.getElementById('btnAbandonarConfirmar');
        if (titulo) titulo.textContent = 'Edita tu avatar';
        if (subAbandono) subAbandono.innerHTML = 'Si sales ahora, los cambios no se guardarán.<br>';
        if (btnAbandono) btnAbandono.innerHTML = '<i class="fas fa-right-from-bracket me-1"></i> Salir';
    },

    abrir: function () {
        this._paso = 1;
        document.getElementById('avatarStep1').style.display = 'block';
        document.getElementById('avatarStep2').style.display = 'none';
        document.getElementById('avatarStep3').style.display = 'none';
        document.getElementById('stepLabel').textContent = STEP_LABELS[0];
        this._actualizarIndicador();
        this._renderColorGrid();
        this._actualizarPreviewModal();
        new bootstrap.Modal(document.getElementById('modalAvatar')).show();
    },

    confirmarAbandonar: function () {
        bootstrap.Modal.getInstance(document.getElementById('modalAvatar')).hide();
        document.getElementById('modalAvatar').addEventListener('hidden.bs.modal', function handler() {
            document.getElementById('modalAvatar').removeEventListener('hidden.bs.modal', handler);
            new bootstrap.Modal(document.getElementById('modalAbandonarAvatar')).show();
        });
    },

    volverDesdeAbandono: function () {
        bootstrap.Modal.getInstance(document.getElementById('modalAbandonarAvatar')).hide();
        document.getElementById('modalAbandonarAvatar').addEventListener('hidden.bs.modal', function handler() {
            document.getElementById('modalAbandonarAvatar').removeEventListener('hidden.bs.modal', handler);
            avatarPicker.abrir();
        });
    },

    abandonar: function () {
        bootstrap.Modal.getInstance(document.getElementById('modalAbandonarAvatar')).hide();

        if (this.modo === 'registro') {
            const colores = AVATAR_COLORS.map(c => c.hex);
            this.state.bgColor = colores[Math.floor(Math.random() * colores.length)];
            this.state.eyes = AVATAR_EYES[Math.floor(Math.random() * AVATAR_EYES.length)];
            this.state.mouth = AVATAR_MOUTHS[Math.floor(Math.random() * AVATAR_MOUTHS.length)];
            this.state.saved = true;
            if (this.onAbandonar) this.onAbandonar(this.state);
        }
    },

    confirmar: function () {
        this.state.saved = true;
        bootstrap.Modal.getInstance(document.getElementById('modalAvatar')).hide();
        if (this.onConfirmar) this.onConfirmar(this.state);
    },

    irPaso: function (paso) {
        document.getElementById(`avatarStep${this._paso}`).style.display = 'none';
        this._paso = paso;
        document.getElementById(`avatarStep${this._paso}`).style.display = 'block';
        document.getElementById('stepLabel').textContent = STEP_LABELS[paso - 1];
        this._actualizarIndicador();
        if (paso === 1) this._renderColorGrid();
        if (paso === 2) this._renderEyesGrid();
        if (paso === 3) this._renderMouthGrid();
        this._actualizarPreviewModal();
    },

    _actualizarIndicador: function () {
        for (let i = 1; i <= 3; i++) {
            const dot = document.getElementById(`dot-${i}`);
            dot.classList.remove('active', 'done');
            if (i < this._paso) dot.classList.add('done');
            else if (i === this._paso) dot.classList.add('active');
        }
        for (let i = 1; i <= 2; i++) {
            const line = document.getElementById(`line-${i}-${i+1}`);
            line.classList.toggle('done', i < this._paso);
        }
    },

    _renderColorGrid: function () {
        const grid = document.getElementById('bgColorGrid');
        const self = this;
        grid.innerHTML = AVATAR_COLORS.map(c => `
            <div class="avatar-color-chip ${c.hex === self.state.bgColor ? 'selected' : ''}"
                 style="background:#${c.hex};"
                 title="${c.name}"
                 onclick="avatarPicker._seleccionarColor('${c.hex}')"></div>
        `).join('');
    },

    _renderEyesGrid: function () {
        const seed = this.getSeed();
        const grid = document.getElementById('eyesGrid');
        const self = this;
        grid.innerHTML = AVATAR_EYES.map(eye => `
            <div class="avatar-option-card ${eye === self.state.eyes ? 'selected' : ''}"
                 onclick="avatarPicker._seleccionarOjos('${eye}')">
                <img src="${AVATAR_BASE_URL}?seed=${seed}&backgroundColor=${self.state.bgColor}&eyes=${eye}&mouth=${self.state.mouth}&rotate=0&scale=100&backgroundType=solid&radius=0&size=52"
                     alt="${eye}">
                <span class="avatar-option-label">${eye}</span>
            </div>
        `).join('');
    },

    _renderMouthGrid: function () {
        const seed = this.getSeed();
        const grid = document.getElementById('mouthGrid');
        const self = this;
        grid.innerHTML = AVATAR_MOUTHS.map(mouth => `
            <div class="avatar-option-card ${mouth === self.state.mouth ? 'selected' : ''}"
                 onclick="avatarPicker._seleccionarBoca('${mouth}')">
                <img src="${AVATAR_BASE_URL}?seed=${seed}&backgroundColor=${self.state.bgColor}&eyes=${self.state.eyes}&mouth=${mouth}&rotate=0&scale=100&backgroundType=solid&radius=0&size=52"
                     alt="${mouth}">
                <span class="avatar-option-label">${mouth}</span>
            </div>
        `).join('');
    },

    _seleccionarColor: function (hex) {
        this.state.bgColor = hex;
        this._renderColorGrid();
        this._actualizarPreviewModal();
    },

    _seleccionarOjos: function (eye) {
        this.state.eyes = eye;
        this._renderEyesGrid();
        this._actualizarPreviewModal();
    },

    _seleccionarBoca: function (mouth) {
        this.state.mouth = mouth;
        this._renderMouthGrid();
        this._actualizarPreviewModal();
    },

    _actualizarPreviewModal: function () {
        const seed = this.getSeed();
        document.getElementById('avatarPreviewModal').src = this.buildUrl(seed, 70);
    },

    buildUrl: function (seed, size = 80) {
        return `${AVATAR_BASE_URL}?seed=${seed}&backgroundColor=${this.state.bgColor}&eyes=${this.state.eyes}&mouth=${this.state.mouth}&rotate=0&scale=100&backgroundType=solid&radius=0&size=${size}`;
    },

    buildParams: function () {
        return `eyes=${this.state.eyes}&mouth=${this.state.mouth}&backgroundColor=${this.state.bgColor}`;
    },

    randomizeState: function () {
        const colores = AVATAR_COLORS.map(c => c.hex);
        this.state.bgColor = colores[Math.floor(Math.random() * colores.length)];
        this.state.eyes = AVATAR_EYES[Math.floor(Math.random() * AVATAR_EYES.length)];
        this.state.mouth = AVATAR_MOUTHS[Math.floor(Math.random() * AVATAR_MOUTHS.length)];
    },
};
