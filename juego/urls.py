from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),
    path('registro/', views.registro, name='registro'),
    path('juego/', views.juego, name='juego'),
    path('perfil/', views.perfil, name='perfil'),
    path('scoreboard/', views.scoreboard, name='scoreboard'),
]