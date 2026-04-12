# utilidades de Django para manejar zonas horarias
from django.utils import timezone
# modelo Sesion para la app juego
from juego.models import Sesion


class CerrarSesionInactivaMiddleware:
    """
    Middleware que cierra automáticamente las sesiones inactivas.
    Se ejecuta en cada request para verificar si una sesión debe ser cerrada.
    """
    def __init__(self, get_response):
        """
        Inicializa el middleware.
        Args:
            get_response: Función que obtiene la respuesta de la vista
        """
        self.get_response = get_response

    def __call__(self, request):
        """
        Se ejecuta en cada request HTTP.
        Verifica si hay una sesión activa que deba ser cerrada por inactividad.
        """
        # Obtiene el ID de sesión y usuario de la sesión actual
        sesion_id = request.session.get('sesion_id')
        usuario_id = request.session.get('usuario_id')

        # Si hay ID de sesión pero no hay usuario (sesión inactiva)
        if sesion_id and not usuario_id:
            try:
                # Intenta obtener la sesión activa (sin fecha de cierre)
                sesion = Sesion.objects.get(id=sesion_id, fecha_cierre_sesion__isnull=True)
                # Obtiene la hora actual
                ahora = timezone.now()
                # Establece la fecha y hora de cierre de la sesión
                sesion.fecha_cierre_sesion = ahora
                sesion.hora_cierre_sesion  = ahora.time()
                # Guarda los cambios en la base de datos
                sesion.save()
            except Sesion.DoesNotExist:
                # Si la sesión no existe, no hace nada
                pass

        # Continúa con el procesamiento normal del request
        return self.get_response(request)