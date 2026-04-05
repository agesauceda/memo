from django.shortcuts import render, redirect

def login(request):
    return render(request, 'auth/login.html')

def registro(request):
    return render(request, 'auth/register.html')

def juego(request):
    if 'usuario_id' not in request.session:
        return redirect('login')
    return render(request, 'juego/index.html')

def perfil(request):
    if 'usuario_id' not in request.session:
        return redirect('login')
    return render(request, 'juego/profile.html')

def scoreboard(request):
    if 'usuario_id' not in request.session:
        return redirect('login')
    return render(request, 'juego/scoreboard.html')
