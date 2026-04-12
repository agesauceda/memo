from django.urls import path  # Importa la función path para definir rutas URL
from . import views  # Importa las vistas del módulo actual

urlpatterns = [  # Lista de rutas de URL para la aplicación juego
    path('', views.login, name='login'),  # Ruta raíz que muestra la vista de login
    path('registro/', views.registro, name='registro'),  # Ruta para el registro de usuarios
    path('juego/', views.juego, name='juego'),  # Ruta principal del juego
    path('perfil/', views.perfil, name='perfil'),  # Ruta para ver el perfil del usuario
    path('scoreboard/', views.scoreboard, name='scoreboard'),  # Ruta para ver el marcador global
]