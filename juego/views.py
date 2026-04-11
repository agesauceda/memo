from django.shortcuts import render, redirect  # Importa render para mostrar plantillas y redirect para redirigir URLs

def login(request):  # Vista que renderiza la página de inicio de sesión
    return render(request, 'auth/login.html')  # Muestra la plantilla de login

def registro(request):  # Vista que renderiza la página de registro
    return render(request, 'auth/register.html')  # Muestra la plantilla de registro

def juego(request):  # Vista principal del juego, requiere sesión activa
    if 'usuario_id' not in request.session:  # Verifica si el usuario está autenticado en sesión
        return redirect('login')  # Redirige al login si no hay usuario en sesión
    return render(request, 'juego/index.html')  # Muestra la plantilla del juego

def perfil(request):  # Vista del perfil de usuario, requiere sesión activa
    if 'usuario_id' not in request.session:  # Verifica si el usuario está autenticado en sesión
        return redirect('login')  # Redirige al login si no hay usuario en sesión
    return render(request, 'juego/profile.html')  # Muestra la plantilla de perfil

def scoreboard(request):  # Vista del marcador, requiere sesión activa
    if 'usuario_id' not in request.session:  # Verifica si el usuario está autenticado en sesión
        return redirect('login')  # Redirige al login si no hay usuario en sesión
    return render(request, 'juego/scoreboard.html')  # Muestra la plantilla del scoreboard
