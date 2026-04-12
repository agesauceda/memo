// Función para mostrar u ocultar la contraseña
function mostrarOcultarContrasena(inputId, btn) {
    const input = document.getElementById(inputId);
    const icono = btn.querySelector('i');
    // Cambia entre mostrar y ocultar contraseña
    if (input.type === 'password') {
        input.type = 'text';
        icono.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icono.className = 'fas fa-eye';
    }
}
// Se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    avatarPicker.initRegistro(
        /* getSeed */     () => document.getElementById('username').value.trim() || 'memo',
        /* onConfirmar */ (state) => actualizarCirculoRegistro(),
        /* onAbandonar */ (state) => actualizarCirculoRegistro()
    );

     // Manejo de inputs OTP (avanzar y retroceder automáticamente)
    ['otp1','otp2','otp3','otp4'].forEach((id, i, arr) => {
        const el = document.getElementById(id);
        if (!el) return;
        // Avanza al siguiente campo cuando se escribe
        el.addEventListener('input', function () {
            if (this.value && i < arr.length - 1)
                document.getElementById(arr[i + 1]).focus();
        });
        // Retrocede con backspace si está vacío
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && !this.value && i > 0)
                document.getElementById(arr[i - 1]).focus();
        });
    });
});
// Abre el modal para seleccionar avatar
function abrirModalAvatar() {
    avatarPicker.abrir();
}
// Actualiza la vista previa del avatar en el registro
function actualizarCirculoRegistro() {
    const seed = document.getElementById('username').value.trim() || 'memo';
    const url = avatarPicker.buildUrl(seed, 90);
    const img = document.getElementById('avatarPreviewCircle');
    const placeholder = document.getElementById('avatarPlaceholder');
    img.src = url;
    img.style.display = 'block';
    placeholder.style.display = 'none';
}
// Evento submit del formulario de registro
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    let valido = true;

    const campos = {
        firstName: { min: 1, errId: 'err-firstName', msgVacio: 'Ingresa tu nombre.', msgCorto: 'Mínimo 1 carácter.' },
        lastName: { min: 1, errId: 'err-lastName', msgVacio: 'Ingresa tu apellido.', msgCorto: 'Mínimo 1 carácter.' },
        phone: { min: 7, errId: 'err-phone', msgVacio: 'Ingresa tu teléfono.', msgCorto: 'Mínimo 7 dígitos.' },
        email: { email: true, errId: 'err-email', msgVacio: 'Ingresa tu correo electrónico.', msgCorto: 'Correo inválido.' },
        username: { min: 4, errId: 'err-username', msgVacio: 'Ingresa un nombre de usuario.', msgCorto: 'Mínimo 4 caracteres.' },
        password: { min: 6, errId: 'err-password', msgVacio: 'Ingresa una contraseña.', msgCorto: 'Mínimo 6 caracteres.' },
        confirmPassword: { match: 'password', errId: 'err-confirmPassword', msgVacio: 'Confirma tu contraseña.', msgCorto: 'Las contraseñas no coinciden.' },
    };

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

     // Limpia errores previos
    Object.keys(campos).forEach(id => {
        const el = document.getElementById(id);
        const err = document.getElementById(campos[id].errId);
        el.classList.remove('is-invalid');
        err.textContent = '';
        err.classList.remove('show');
    });

    Object.entries(campos).forEach(([id, reglas]) => {
        const el = document.getElementById(id);
        const val = el.value.trim();
        let fallo = false;
        let msg = '';

        if (reglas.email) {
            if (!val) { fallo = true; msg = reglas.msgVacio; }
            else if (!emailRx.test(val)) { fallo = true; msg = reglas.msgCorto; }
            // Validación de coincidencia de contraseñas
        } else if (reglas.match) {
            if (!val) { fallo = true; msg = reglas.msgVacio; }
            else if (val !== document.getElementById(reglas.match).value.trim()) { fallo = true; msg = reglas.msgCorto; }
        } else {
            if (!val) { fallo = true; msg = reglas.msgVacio; }
            else if (val.length < reglas.min) { fallo = true; msg = reglas.msgCorto; }
        }

        if (fallo) {
            el.classList.add('is-invalid');
            const err = document.getElementById(reglas.errId);
            err.textContent = msg;
            err.classList.add('show');
            valido = false;
        }
    });
 // Si todo es válido
    if (valido) {
        if (!avatarPicker.state.saved) {
            avatarPicker.randomizeState();
        }
        registrarUsuario();
    }
});

let _otpFormData = null;
let _otpUsuarioId = null;
// Envía datos para registrar usuario y generar OTP
function registrarUsuario() {
    const seed = document.getElementById('username').value.trim();
    const avatar = avatarPicker.buildParams();

    const formData = new FormData();
    formData.append('nombre', document.getElementById('firstName').value.trim());
    formData.append('apellido', document.getElementById('lastName').value.trim());
    formData.append('telefono', document.getElementById('phone').value.trim());
    formData.append('correo_electronico', document.getElementById('email').value.trim());
    formData.append('nombre_usuario', seed);
    formData.append('contrasena', document.getElementById('password').value.trim());
    formData.append('avatar', avatar);

    _otpFormData = formData;
 // Petición al backend para enviar OTP
    fetch('/api/enviar_otp_registro/', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            _otpUsuarioId = data.usuario_id;
             // Muestra correo en modal
            document.getElementById('otpEmailDisplay').textContent =
                document.getElementById('email').value.trim();
            ['otp1','otp2','otp3','otp4'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('err-otp').style.display = 'none';
            new bootstrap.Modal(document.getElementById('otpModal')).show();
        } else {
            // Manejo de errores
            if (data.errores) {
                Object.entries(data.errores).forEach(([campo, msg]) => mostrarErrorRegistro(msg, campo));
            } else {
                mostrarErrorRegistro(data.msg, data.campo);
            }
        }
    })
    .catch(err => console.error('Error en registro:', err));
}
// Muestra errores en campos específicos del formulario
function mostrarErrorRegistro(mensaje, campo) {
    const mapa = {
        nombre: { inputId: 'firstName', errId: 'err-firstName' },
        apellido: { inputId: 'lastName', errId: 'err-lastName' },
        correo: { inputId: 'email', errId: 'err-email' },
        nombre_usuario: { inputId: 'username', errId: 'err-username' },
        contrasena: { inputId: 'password', errId: 'err-password' },
    };
    const target = mapa[campo];
    if (target) {
        document.getElementById(target.inputId).classList.add('is-invalid');
        const err = document.getElementById(target.errId);
        err.textContent = mensaje;
        err.classList.add('show');
    } else {
         // Error general
        const errEl = document.getElementById('err-username');
        document.getElementById('username').classList.add('is-invalid');
        errEl.textContent = mensaje;
        errEl.classList.add('show');
    }
}
// Verifica el código OTP ingresado
function verifyOtp() {
    const codigo = ['otp1','otp2','otp3','otp4']
        .map(id => document.getElementById(id).value.trim())
        .join('');

    if (codigo.length < 4) {
        document.getElementById('err-otp').textContent = 'Ingresa los 4 dígitos del código.';
        document.getElementById('err-otp').style.display = 'block';
        return;
    }

    const formData = new FormData();
    formData.append('usuario_id', _otpUsuarioId);
    formData.append('codigo', codigo);

    fetch('/api/verificar_otp/', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            bootstrap.Modal.getInstance(document.getElementById('otpModal')).hide();
            try {
                sessionStorage.setItem('toast_registro_ok', '1');
            } catch (e) {
                console.warn('No se pudo guardar el estado de registro:', e);
            }
            window.location.href = data.redirect_url;
        } else {
            document.getElementById('err-otp').textContent = data.msg;
            document.getElementById('err-otp').style.display = 'block';
        }
    })
    .catch(err => console.error('Error verificando OTP:', err));
}

function resendOtp() {
    if (!_otpFormData) return;
  // Petición para verificar OTP
    fetch('/api/enviar_otp_registro/', {
        method: 'POST',
        body: _otpFormData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            _otpUsuarioId = data.usuario_id;
            // Limpia inputs
            ['otp1','otp2','otp3','otp4'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('err-otp').textContent = 'Código reenviado.';
            document.getElementById('err-otp').style.display = 'block';
        } else {
            document.getElementById('err-otp').textContent = data.msg;
            document.getElementById('err-otp').style.display = 'block';
        }
    })
    .catch(err => console.error('Error reenviando OTP:', err));
}
