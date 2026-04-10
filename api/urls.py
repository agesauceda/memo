from django.urls import path
from . import views

# Este bloque de código define los patrones de URL para tu aplicación Django. Cada llamada a la función `path`
# especifica un patrón de URL junto con la función de vista correspondiente que debe ser llamada cuando se accede a esa
# URL.
urlpatterns = [
    path('login/', views.login, name='api_login'),
    path('registro/', views.registro, name='api_registro'),
    path('logout/', views.logout, name='api_logout'),
    path('categorias/', views.obtener_categorias, name='api_categorias'),
    path('cartas/<int:categoria_id>/', views.obtener_cartas, name='api_cartas'),
    path('guardar_partida/', views.guardar_partida, name='api_guardar_partida'),
    path('scoreboard/', views.scoreboard, name='api_scoreboard'),
    path('perfil/', views.perfil, name='api_perfil'),
    path('enviar_otp_registro/', views.enviar_otp_registro, name='api_enviar_otp_registro'),
    path('verificar_otp/', views.verificar_otp, name='api_verificar_otp'),
    path('recuperar_contrasena/', views.recuperar_contrasena, name='api_recuperar_contrasena'),
    path('verificar_otp_recuperacion/', views.verificar_otp_recuperacion, name='api_verificar_otp_recuperacion'),
    path('actualizar_avatar/', views.actualizar_avatar, name='api_actualizar_avatar'),
    path('eliminar_cuenta/', views.eliminar_cuenta, name='api_eliminar_cuenta'),
]
