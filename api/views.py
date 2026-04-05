import json
from django.db.models import Sum, Avg
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
import random
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from juego.models import Usuario, CategoriaJuego, Carta, Partida, EstadisticaJugador, Rango, Sesion, CodigoOTP
from decimal import Decimal

#  LOGIN
@csrf_exempt
def login(request):
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    nombre_usuario = request.POST.get('nombre_usuario', '').strip()
    contrasena = request.POST.get('contrasena', '').strip()

    if not nombre_usuario or not contrasena:
        return JsonResponse({"status": False, "msg": "Todos los campos son obligatorios"})

    errores = {}
    usuario_obj = None

    try:
        usuario_obj = Usuario.objects.get(nombre_usuario=nombre_usuario, activo=True)
    except Usuario.DoesNotExist:
        if Usuario.objects.filter(nombre_usuario=nombre_usuario, activo=False).exists():
            errores['usuario'] = 'Lo sentimos, este usuario ha sido eliminado o ya no existe'
        else:
            errores['usuario'] = 'Usuario incorrecto'

    if usuario_obj and not check_password(contrasena, usuario_obj.contrasena):
        errores['contrasena'] = 'Contraseña incorrecta'

    if errores:
        return JsonResponse({'status': False, 'errores': errores})

    usuario = usuario_obj
    
    request.session['usuario_id'] = usuario.id
    request.session['nombre_usuario'] = usuario.nombre_usuario
    request.session['nombre'] = usuario.nombre
    request.session['avatar'] = usuario.avatar or ''

    ahora = timezone.now()
    sesion = Sesion.objects.create(
        usuario=usuario,
        hora_inicio_sesion=ahora.time()
    )
    request.session['sesion_id'] = sesion.id

    return JsonResponse({"status": True, "msg": "Acceso correcto", "redirect_url": "/juego/"})

#  REGISTRO
@csrf_exempt
def registro(request):
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    nombre = request.POST.get('nombre', '').strip()
    apellido = request.POST.get('apellido', '').strip()
    telefono = request.POST.get('telefono', '').strip()
    correo = request.POST.get('correo_electronico', '').strip()
    nombre_usuario = request.POST.get('nombre_usuario', '').strip()
    contrasena = request.POST.get('contrasena', '').strip()
    avatar = request.POST.get('avatar', '')

    campos_requeridos = {
        'nombre': nombre,
        'apellido': apellido,
        'correo': correo,
        'nombre_usuario': nombre_usuario,
        'contrasena': contrasena,
    }
    for campo, valor in campos_requeridos.items():
        if not valor:
            return JsonResponse({"status": False, "msg": "Este campo es obligatorio.", "campo": campo})

    errores_duplicados = {}
    if Usuario.objects.filter(correo_electronico=correo).exists():
        errores_duplicados['correo'] = 'Este correo ya está registrado.'
    if Usuario.objects.filter(nombre_usuario=nombre_usuario).exists():
        errores_duplicados['nombre_usuario'] = 'Este nombre de usuario ya está en uso.'
    if errores_duplicados:
        return JsonResponse({"status": False, "errores": errores_duplicados})

    try:
        rango = Rango.objects.get(nombre='Sin Rango')
    except Rango.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Error de configuración: el rango inicial no existe"})

    try:
        usuario = Usuario.objects.create(
            nombre=nombre,
            apellido=apellido,
            telefono=telefono,
            correo_electronico=correo,
            nombre_usuario=nombre_usuario,
            contrasena=make_password(contrasena),
            rango=rango,
            avatar=avatar,
        )
        EstadisticaJugador.objects.create(usuario=usuario)
        return JsonResponse({"status": True, "msg": "Registro exitoso", "redirect_url": "/"})
    except Exception as e:
        return JsonResponse({"status": False, "msg": f"Error en el registro: {str(e)}"})

#  LOGOUT
@csrf_exempt
def logout(request):
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    sesion_id = request.POST.get('sesion_id') or request.session.get('sesion_id')

    if sesion_id:
        try:
            ahora = timezone.now()
            sesion = Sesion.objects.get(id=sesion_id, fecha_cierre_sesion__isnull=True)
            sesion.fecha_cierre_sesion = ahora
            sesion.hora_cierre_sesion = ahora.time()
            sesion.save()
        except Sesion.DoesNotExist:
            pass

    request.session.flush()
    return JsonResponse({"status": True, "msg": "Sesión cerrada", "redirect_url": "/"})

#  OBTENER NIVELES
def obtener_categorias(request):
    if 'usuario_id' not in request.session:
        return JsonResponse({"status": False, "msg": "Sesión no iniciada"})
    try:
        categorias = CategoriaJuego.objects.values(
            'id', 'nombre', 'intentos_max', 'tiempo_limite'
        ).order_by('id')
        return JsonResponse({"status": True, "categorias": list(categorias)})
    except Exception as e:
        return JsonResponse({"status": False, "msg": str(e)})

#  OBTENER CARTAS
def obtener_cartas(request, categoria_id):
    if 'usuario_id' not in request.session:
        return JsonResponse({"status": False, "msg": "Sesión no iniciada"})

    try:
        CategoriaJuego.objects.get(id=categoria_id)
    except CategoriaJuego.DoesNotExist:
        return JsonResponse({"status": False, "msg": f"El nivel {categoria_id} no existe"})

    try:
        cartas = Carta.objects.filter(categoria_id=categoria_id, activa=True).values(
            'id', 'nombre_carta', 'ruta_imagen', 'par_id'
        )
        return JsonResponse({"status": True, "cartas": list(cartas)})
    except Exception as e:
        return JsonResponse({"status": False, "msg": str(e)})

#  GUARDAR PARTIDA
@csrf_exempt
def guardar_partida(request):
    if 'usuario_id' not in request.session:
        return JsonResponse({"status": False, "msg": "Sesión no iniciada"})
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    categoria_id = request.POST.get('categoria_id')
    estado = request.POST.get('estado')
    tiempo_jugado_raw = request.POST.get('tiempo_jugado')
    movimientos = request.POST.get('movimientos')
    intentos_realizados = request.POST.get('intentos_realizados')
    puntaje_raw = request.POST.get('puntaje')

    if not all([categoria_id, estado, tiempo_jugado_raw, movimientos, intentos_realizados, puntaje_raw]):
        return JsonResponse({"status": False, "msg": "Faltan campos obligatorios"})

    ESTADOS_VALIDOS = ['Ganada', 'Perdida', 'Abandonada']
    if estado not in ESTADOS_VALIDOS:
        return JsonResponse({"status": False, "msg": f"Estado inválido. Debe ser uno de: {', '.join(ESTADOS_VALIDOS)}"})

    try:
        puntaje = int(puntaje_raw)
        tiempo_jugado = int(tiempo_jugado_raw)
    except (ValueError, TypeError):
        return JsonResponse({"status": False, "msg": "El puntaje y el tiempo deben ser valores numéricos"})

    try:
        usuario = Usuario.objects.get(id=request.session['usuario_id'])
    except Usuario.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Usuario de sesión no encontrado"})

    try:
        categoria = CategoriaJuego.objects.get(id=categoria_id)
    except CategoriaJuego.DoesNotExist:
        return JsonResponse({"status": False, "msg": f"El nivel {categoria_id} no existe"})

    try:
        Partida.objects.create(
            usuario=usuario,
            categoria=categoria,
            estado=estado,
            tiempo_jugado=tiempo_jugado,
            movimientos=movimientos,
            intentos_realizados=intentos_realizados,
            puntaje=puntaje
        )

        stats = EstadisticaJugador.objects.get(usuario=usuario)
        stats.total_partidas += 1
        if estado == 'Ganada':
            stats.total_victorias += 1
        elif estado == 'Perdida':
            stats.total_derrotas += 1
        else:
            stats.total_abandonadas += 1
        stats.puntaje_acumulado += puntaje

        stats.promedio_tiempo = (
            (stats.promedio_tiempo * (stats.total_partidas - 1) + tiempo_jugado)
            / stats.total_partidas
        )

        from django.db.models import Count
        cat_mas_jugada = (
            Partida.objects
            .filter(usuario=usuario)
            .values('categoria')
            .annotate(total=Count('categoria'))
            .order_by('-total')
            .first()
        )
        if cat_mas_jugada:
            stats.categoria_mas_jugada = CategoriaJuego.objects.get(id=cat_mas_jugada['categoria'])

        stats.save()

        rango = Rango.objects.filter(
            puntaje_min__lte=stats.puntaje_acumulado,
            puntaje_max__gte=stats.puntaje_acumulado
        ).first()
        if rango:
            usuario.rango = rango
            usuario.save()

        return JsonResponse({"status": True, "msg": "Partida guardada"})
    except Exception as e:
        return JsonResponse({"status": False, "msg": str(e)})

#  SCOREBOARD
def scoreboard(request):
    if 'usuario_id' not in request.session:
        return JsonResponse({"status": False, "msg": "Sesión no iniciada"})
    if request.method != 'GET':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    try:
        rangos = list(Rango.objects.order_by('puntaje_min'))

        def obtener_rango_por_puntaje(puntaje):
            for r in rangos:
                if r.puntaje_min <= puntaje <= r.puntaje_max:
                    return r.nombre
            return 'Sin Rango'

        partidas = (
            Partida.objects
            .filter(usuario__activo=True)
            .values(
                'usuario__nombre_usuario',
                'usuario__avatar',
                'categoria__nombre'
            )
            .annotate(
                puntaje=Sum('puntaje'),
                tiempo_jugado=Avg('tiempo_jugado')
            )
            .order_by('-puntaje')
        )

        resultado = []
        for fila in partidas[:20]:
            fila['usuario__rango__nombre'] = obtener_rango_por_puntaje(fila['puntaje'])
            resultado.append(fila)

        return JsonResponse({"status": True, "scoreboard": resultado})
    except Exception as e:
        return JsonResponse({"status": False, "msg": str(e)})

#  PERFIL
def perfil(request):
    if 'usuario_id' not in request.session:
        return JsonResponse({"status": False, "msg": "Sesión no iniciada"})
    if request.method != 'GET':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    PARTIDAS_POR_PAGINA = 15

    try:
        usuario = Usuario.objects.select_related('rango').get(id=request.session['usuario_id'])
    except Usuario.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Usuario no encontrado"})

    try:
        stats = EstadisticaJugador.objects.select_related('categoria_mas_jugada').get(usuario=usuario)
    except EstadisticaJugador.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Estadísticas del jugador no encontradas"})

    try:
        page = max(1, int(request.GET.get('page', 1)))
    except (ValueError, TypeError):
        page = 1

    total_partidas = Partida.objects.filter(usuario=usuario).count()
    total_paginas = max(1, (total_partidas + PARTIDAS_POR_PAGINA - 1) // PARTIDAS_POR_PAGINA)
    page = min(page, total_paginas)
    offset = (page - 1) * PARTIDAS_POR_PAGINA

    partidas_qs = Partida.objects.filter(usuario=usuario).order_by('-fecha_partida')[offset:offset + PARTIDAS_POR_PAGINA]

    historial = []
    for p in partidas_qs:
        historial.append({
            'categoria__nombre': p.categoria.nombre,
            'estado': p.estado,
            'puntaje': p.puntaje,
            'tiempo_jugado': p.tiempo_jugado,
            'fecha_partida': p.fecha_partida.strftime("%d/%m/%Y") if p.fecha_partida else '—',
        })

    categoria_mas_jugada = stats.categoria_mas_jugada.nombre if stats.categoria_mas_jugada else '—'

    return JsonResponse({
        "status": True,
        "usuario": usuario.toDict(),
        "estadisticas": {
            "total_partidas": stats.total_partidas,
            "total_victorias": stats.total_victorias,
            "total_derrotas": stats.total_derrotas,
            "total_abandonadas": stats.total_abandonadas,
            "puntaje_acumulado": stats.puntaje_acumulado,
            "promedio_tiempo": float(stats.promedio_tiempo),
            "categoria_mas_jugada": categoria_mas_jugada,
        },
        "historial": historial,
        "paginacion": {
            "page": page,
            "total_paginas": total_paginas,
            "total_partidas": total_partidas,
            "por_pagina": PARTIDAS_POR_PAGINA,
        }
    })

#  HELPER - OTP
def _generar_y_enviar_otp(usuario, tipo):
    codigo = str(random.randint(1000, 9999))
    CodigoOTP.objects.create(usuario=usuario, codigo=codigo, tipo=tipo)

    if tipo == 'registro':
        asunto = 'Memo Game — Verifica tu cuenta'
        cuerpo = (
            f'Hola {usuario.nombre},\n\n'
            f'Tu código de verificación es: {codigo}\n\n'
            f'Este código expira en 10 minutos.\n\n'
            f'- Equipo Memo'
        )
    else:
        asunto = 'Memo App — Recuperación de contraseña'
        cuerpo = (
            f'Hola {usuario.nombre},\n\n'
            f'Tu código para restablecer tu contraseña es: {codigo}\n\n'
            f'Este código expira en 10 minutos.\n\n'
            f'Si no solicitaste esto, ignora este correo.\n\n'
            f'- Equipo Memo'
        )

    send_mail(asunto, cuerpo, settings.DEFAULT_FROM_EMAIL, [usuario.correo_electronico], fail_silently=False)
    return codigo

def _validar_otp(usuario_id, codigo, tipo):
    try:
        otp = CodigoOTP.objects.filter(
            usuario_id=usuario_id,
            codigo=codigo,
            tipo=tipo,
            used=False,
            created_at__gte=timezone.now() - timedelta(minutes=10)
        ).latest('created_at')
        return True, otp
    except CodigoOTP.DoesNotExist:
        return False, "Código incorrecto o expirado"

#  ENVIAR OTP REGISTRO
@csrf_exempt
def enviar_otp_registro(request):
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    nombre = request.POST.get('nombre', '').strip()
    apellido = request.POST.get('apellido', '').strip()
    telefono = request.POST.get('telefono', '').strip()
    correo = request.POST.get('correo_electronico', '').strip()
    nombre_usuario = request.POST.get('nombre_usuario', '').strip()
    contrasena = request.POST.get('contrasena', '').strip()
    avatar = request.POST.get('avatar', '')

    campos_requeridos = {
        'nombre': nombre,
        'apellido': apellido,
        'correo': correo,
        'nombre_usuario': nombre_usuario,
        'contrasena': contrasena,
    }
    for campo, valor in campos_requeridos.items():
        if not valor:
            return JsonResponse({"status": False, "msg": "Este campo es obligatorio.", "campo": campo})

    errores_duplicados = {}
    if Usuario.objects.filter(correo_electronico=correo, activo=True).exists():
        errores_duplicados['correo'] = 'Este correo ya está registrado.'
    if Usuario.objects.filter(nombre_usuario=nombre_usuario, activo=True).exists():
        errores_duplicados['nombre_usuario'] = 'Este nombre de usuario ya está en uso.'
    if errores_duplicados:
        return JsonResponse({"status": False, "errores": errores_duplicados})

    try:
        rango = Rango.objects.get(nombre='Sin Rango')
    except Rango.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Error de configuración: el rango inicial no existe"})

    Usuario.objects.filter(correo_electronico=correo, activo=False).delete()
    Usuario.objects.filter(nombre_usuario=nombre_usuario, activo=False).delete()

    try:
        usuario = Usuario.objects.create(
            nombre=nombre,
            apellido=apellido,
            telefono=telefono,
            correo_electronico=correo,
            nombre_usuario=nombre_usuario,
            contrasena=make_password(contrasena),
            rango=rango,
            avatar=avatar,
            activo=False,
        )
        EstadisticaJugador.objects.create(usuario=usuario)
        _generar_y_enviar_otp(usuario, 'registro')
        return JsonResponse({"status": True, "msg": "Código enviado", "usuario_id": usuario.id})
    except Exception as e:
        return JsonResponse({"status": False, "msg": f"Error al crear usuario: {str(e)}"})

#  VERIFICAR OTP REGISTRO
@csrf_exempt
def verificar_otp(request):
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    usuario_id = request.POST.get('usuario_id', '').strip()
    codigo = request.POST.get('codigo', '').strip()

    if not usuario_id or not codigo:
        return JsonResponse({"status": False, "msg": "Faltan datos"})

    valido, resultado = _validar_otp(usuario_id, codigo, 'registro')
    if not valido:
        return JsonResponse({"status": False, "msg": resultado})

    try:
        usuario = Usuario.objects.get(id=usuario_id)
        usuario.activo = True
        usuario.save()
        resultado.used = True
        resultado.save()
        return JsonResponse({"status": True, "msg": "Cuenta verificada", "redirect_url": "/"})
    except Usuario.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Usuario no encontrado"})

#  RECUPERAR CONTRASEÑA - OTP
@csrf_exempt
def recuperar_contrasena(request):
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    correo = request.POST.get('correo', '').strip()
    if not correo:
        return JsonResponse({"status": False, "msg": "El correo es obligatorio"})

    try:
        usuario = Usuario.objects.get(correo_electronico=correo, activo=True)
    except Usuario.DoesNotExist:
        return JsonResponse({"status": True, "msg": "Si el correo existe, recibirás un código", "usuario_id": None})

    try:
        _generar_y_enviar_otp(usuario, 'recuperacion')
        return JsonResponse({"status": True, "msg": "Código enviado", "usuario_id": usuario.id})
    except Exception as e:
        return JsonResponse({"status": False, "msg": f"Error al enviar el correo: {str(e)}"})

#  VERIFICAR OTP RECUPERACIÓN + nueva contraseña
@csrf_exempt
def verificar_otp_recuperacion(request):
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    usuario_id = request.POST.get('usuario_id', '').strip()
    codigo = request.POST.get('codigo', '').strip()
    nueva_contrasena = request.POST.get('nueva_contrasena', '').strip()

    if not all([usuario_id, codigo, nueva_contrasena]):
        return JsonResponse({"status": False, "msg": "Faltan datos"})

    valido, resultado = _validar_otp(usuario_id, codigo, 'recuperacion')
    if not valido:
        return JsonResponse({"status": False, "msg": resultado})

    try:
        usuario = Usuario.objects.get(id=usuario_id, activo=True)
        usuario.contrasena = make_password(nueva_contrasena)
        usuario.save()
        resultado.used = True
        resultado.save()
        return JsonResponse({"status": True, "msg": "Contraseña actualizada", "redirect_url": "/"})
    except Usuario.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Usuario no encontrado"})
    
#  ACTUALIZAR AVATAR
@csrf_exempt
def actualizar_avatar(request):
    if 'usuario_id' not in request.session:
        return JsonResponse({"status": False, "msg": "Sesión no iniciada"})
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Método no permitido"})

    avatar = request.POST.get('avatar', '').strip()
    if not avatar:
        return JsonResponse({"status": False, "msg": "Avatar vacío"})

    try:
        usuario = Usuario.objects.get(id=request.session['usuario_id'])
        usuario.avatar = avatar
        usuario.save()
        request.session['avatar'] = avatar
        return JsonResponse({"status": True, "msg": "Avatar actualizado"})
    except Usuario.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Usuario no encontrado"})

#  ELIMINAR CUENTA (DESACTIVAR)
@csrf_exempt
def eliminar_cuenta(request):
    if 'usuario_id' not in request.session:
        return JsonResponse({"status": False, "msg": "Sesion no iniciada"})
    if request.method != 'POST':
        return JsonResponse({"status": False, "msg": "Metodo no permitido"})

    try:
        usuario = Usuario.objects.get(id=request.session['usuario_id'])
    except Usuario.DoesNotExist:
        return JsonResponse({"status": False, "msg": "Usuario no encontrado"})

    sesion_id = request.POST.get('sesion_id') or request.session.get('sesion_id')
    if sesion_id:
        try:
            ahora = timezone.now()
            sesion = Sesion.objects.get(id=sesion_id, fecha_cierre_sesion__isnull=True)
            sesion.fecha_cierre_sesion = ahora
            sesion.hora_cierre_sesion = ahora.time()
            sesion.save()
        except Sesion.DoesNotExist:
            pass

    suffix = f"_inactivo_{usuario.id}"
    base = usuario.nombre_usuario or "usuario"
    max_base = 50 - len(suffix)
    if max_base < 1:
        base = "u"
        max_base = 1
    base = base[:max_base]
    usuario.nombre_usuario = f"{base}{suffix}"

    correo_suffix = f"_inactivo_{usuario.id}"
    correo_base = usuario.correo_electronico or "correo"
    max_correo_base = 100 - len(correo_suffix)
    if max_correo_base < 1:
        correo_base = "c"
        max_correo_base = 1
    correo_base = correo_base[:max_correo_base]
    usuario.correo_electronico = f"{correo_base}{correo_suffix}"

    usuario.activo = False
    usuario.save()

    request.session.flush()
    return JsonResponse({"status": True, "msg": "Cuenta desactivada", "redirect_url": "/"})
