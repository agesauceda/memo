from django.utils import timezone
from juego.models import Sesion


class CerrarSesionInactivaMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
       
        sesion_id = request.session.get('sesion_id')
        usuario_id = request.session.get('usuario_id')

        if sesion_id and not usuario_id:
            try:
                sesion = Sesion.objects.get(id=sesion_id, fecha_cierre_sesion__isnull=True)
                ahora = timezone.now()
                sesion.fecha_cierre_sesion = ahora
                sesion.hora_cierre_sesion  = ahora.time()
                sesion.save()
            except Sesion.DoesNotExist:
                pass

        return self.get_response(request)