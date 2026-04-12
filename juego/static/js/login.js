// Función para mostrar u ocultar la contraseña
function mostrarOcultarContrasena(inputId, btn){
    const input = document.getElementById(inputId);
    const icono = btn.querySelector('i');
    // Si el tipo actual es 'password', lo cambia a texto visible
    if (input.type === 'password'){
        input.type = 'text';
        icono.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password'; // Oculta la contraseña nuevamente
        icono.className = 'fas fa-eye'; // Cambia el icono a "mostrar"
    }
}

// Evento que se ejecuta al enviar el formulario de login
document.getElementById('loginForm').addEventListener('submit', function (e){
    e.preventDefault();
    let valido = true; // Bandera para validar el formulario


       // Obtiene los campos de usuario y contraseña
    const usuario = document.getElementById('username');
    const contrasena = document.getElementById('password');

     // Limpia errores previos en ambos campos

    [usuario, contrasena].forEach(el => {
        el.classList.remove('is-invalid');
        const errEl = document.getElementById('err-' + el.id);
        errEl.classList.remove('show');
        errEl.textContent = '';
    });

    // Valida si el usuario está vacío
    if (!usuario.value.trim()) {
        usuario.classList.add('is-invalid');
        const errU = document.getElementById('err-username');
        errU.textContent = 'Ingresa tu nombre de usuario.';
        errU.classList.add('show');
        valido = false;
    }
 
    if (!contrasena.value.trim()) {
        contrasena.classList.add('is-invalid');
        const errP = document.getElementById('err-password');
        errP.textContent = 'Ingresa tu contraseña.';
        errP.classList.add('show');
        valido = false;
    }
 
    // Función que envía los datos al servidor para iniciar sesión
    if (valido) iniciarSesion(usuario.value.trim(), contrasena.value.trim());
});

function iniciarSesion(nombreUsuario, contrasena){
    const formData = new FormData();
    formData.append('nombre_usuario', nombreUsuario);
    formData.append('contrasena', contrasena);

    fetch('/api/login/', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            try {
                sessionStorage.setItem('toast_login_ok', '1');
            } catch (e) {
                console.warn('No se pudo guardar el estado de login:', e);
            }
            window.location.href = data.redirect_url;
        } else {
            mostrarErrorLogin(data.errores || {});
        }
    })
    .catch(err => console.error('Error en login:', err));
}


// Función para mostrar errores de login
function mostrarErrorLogin(errores) {
    const usuarioInput = document.getElementById('username');
    const contrasenaInput = document.getElementById('password');
    const errUsuario = document.getElementById('err-username');
    const errContrasena = document.getElementById('err-password');

    usuarioInput.classList.remove('is-invalid');
    contrasenaInput.classList.remove('is-invalid');
    errUsuario.textContent = '';
    errUsuario.classList.remove('show');
    errContrasena.textContent = '';
    errContrasena.classList.remove('show');

     // Error relacionado al usuario
    if (errores.usuario) {
        usuarioInput.classList.add('is-invalid');
        contrasenaInput.classList.add('is-invalid');
        errUsuario.textContent = errores.usuario;
        errUsuario.classList.add('show');
        errContrasena.textContent = 'Verifica también tu contraseña.';
        errContrasena.classList.add('show');
        if (usuarioInput.value.trim()) usuarioInput.value = '';
        if (contrasenaInput.value.trim()) contrasenaInput.value = '';
    }

     // Error específico de contraseña
    if (errores.contrasena) {
        contrasenaInput.classList.add('is-invalid');
        errContrasena.textContent = errores.contrasena;
        errContrasena.classList.add('show');
        if (contrasenaInput.value.trim()) contrasenaInput.value = '';
    }
}

let _resetUsuarioId = null;

// Función para enviar solicitud de recuperación de contraseña
function enviarRecuperacion() {
    const email = document.getElementById('recoverEmail');
    const errEl = document.getElementById('err-recover');
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Limpia errores previos
    email.classList.remove('is-invalid');
    errEl.classList.remove('show');

    // Valida formato de email
    if (!emailRx.test(email.value.trim())) {
        email.classList.add('is-invalid');
        errEl.classList.add('show');
        return;
    }

    const formData = new FormData();
    formData.append('correo', email.value.trim());

     // Envía petición al servidor
    fetch('/api/recuperar_contrasena/', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            _resetUsuarioId = data.usuario_id;
            bootstrap.Modal.getInstance(document.getElementById('recoverModal')).hide();
            document.getElementById('recoverModal').addEventListener('hidden.bs.modal', function handler() {
                document.getElementById('recoverModal').removeEventListener('hidden.bs.modal', handler);
                ['resetOtp1','resetOtp2','resetOtp3','resetOtp4'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                const np = document.getElementById('resetNewPassword');
                if (np) np.value = '';
                const errReset = document.getElementById('err-reset-otp');
                if (errReset) errReset.style.display = 'none';
                new bootstrap.Modal(document.getElementById('resetOtpModal')).show();
            });
        } else {
            errEl.textContent = data.msg;
            errEl.classList.add('show');
        }
    })
    .catch(err => console.error('Error en recuperación:', err));
}

// Evento que se ejecuta cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function () {
    ['resetOtp1','resetOtp2','resetOtp3','resetOtp4'].forEach((id, i, arr) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', function () {
            if (this.value && i < arr.length - 1)
                document.getElementById(arr[i + 1]).focus();
        });
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && !this.value && i > 0)
                document.getElementById(arr[i - 1]).focus();
        });
    });
});
// Función para verificar el código OTP y cambiar contraseña
function verificarOtpReset() {
    const codigo = ['resetOtp1','resetOtp2','resetOtp3','resetOtp4']
        .map(id => document.getElementById(id).value.trim())
        .join('');
    const nuevaContrasena = document.getElementById('resetNewPassword').value.trim();
    const errEl = document.getElementById('err-reset-otp');

    if (codigo.length < 4) {
        errEl.textContent = 'Ingresa los 4 dígitos del código.';
        errEl.style.display = 'block';
        return;
    }
    if (!nuevaContrasena || nuevaContrasena.length < 6) {
        errEl.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
        errEl.style.display = 'block';
        return;
    }

    const formData = new FormData();
    formData.append('usuario_id', _resetUsuarioId);
    formData.append('codigo', codigo);
    formData.append('nueva_contrasena', nuevaContrasena);

    // Envía datos al servidor para verificar OTP
    fetch('/api/verificar_otp_recuperacion/', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            bootstrap.Modal.getInstance(document.getElementById('resetOtpModal')).hide();
            try {
                sessionStorage.setItem('toast_reset_ok', '1');
            } catch (e) {
                console.warn('No se pudo guardar el estado de restablecer:', e);
            }
            window.location.href = data.redirect_url; // Redirige
        } else {
            errEl.textContent = data.msg;
            errEl.style.display = 'block';
        }
    })
    .catch(err => console.error('Error verificando OTP reset:', err));
}
