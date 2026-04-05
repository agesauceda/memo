from django.db import models

class Rango(models.Model):
    nombre = models.CharField(max_length=20)
    puntaje_min = models.IntegerField(default=0)
    puntaje_max = models.IntegerField()
    orden = models.SmallIntegerField()

    class Meta:
        db_table = 'Rangos'

class Usuario (models.Model):
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    telefono = models.CharField(max_length=15, null=True, blank=True)
    correo_electronico = models.CharField(max_length=100, unique=True)
    nombre_usuario = models.CharField(max_length=50, unique=True)
    contrasena = models.CharField(max_length=255)
    rango = models.ForeignKey(Rango, on_delete=models.SET_NULL, null=True, related_name='usuarios')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    avatar = models.CharField(max_length=255, null=True, blank=True) 


    def toDict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "nombre_usuario": self.nombre_usuario,
            "rango": self.rango.nombre if self.rango else "Sin Rango",
            "fecha_registro": self.fecha_registro.strftime("%d/%m/%Y") if self.fecha_registro else "—",
            "avatar": self.avatar or "",
        }
    
    class Meta:
        db_table = 'Usuario'

class Sesion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='sesion')
    fecha_inicio_sesion = models.DateTimeField(auto_now_add=True)
    fecha_cierre_sesion = models.DateTimeField(null=True, blank=True)
    hora_inicio_sesion = models.TimeField(null=True, blank=True)
    hora_cierre_sesion = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'Sesion'

class CategoriaJuego(models.Model):
    nombre = models.CharField(max_length=20, unique=True)
    intentos_max = models.SmallIntegerField()
    tiempo_limite = models.SmallIntegerField()
    filas = models.SmallIntegerField(default=4)
    columnas = models.SmallIntegerField(default=4)

    class Meta:
        db_table = 'Categorias_Juego'

class Carta(models.Model):
    categoria = models.ForeignKey(CategoriaJuego, on_delete=models.CASCADE, related_name='cartas')
    par_id = models.SmallIntegerField()
    nombre_carta = models.CharField(max_length=50)
    ruta_imagen = models.CharField(max_length=200)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'Cartas'

class Partida(models.Model):
    ESTADOS = [
        ('Ganada', 'Ganada'),
        ('Perdida', 'Perdida'),
        ('Abandonada', 'Abandonada'),
    ]
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='partidas')
    categoria = models.ForeignKey(CategoriaJuego, on_delete=models.RESTRICT, related_name='partidas')
    estado = models.CharField(max_length=10, choices=ESTADOS)
    tiempo_jugado = models.SmallIntegerField(default=0)
    movimientos = models.SmallIntegerField(default=0)
    intentos_realizados = models.SmallIntegerField(default=0)
    puntaje = models.IntegerField(default=0)
    fecha_partida = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Partida'

class EstadisticaJugador(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='estadisticas')
    total_partidas = models.IntegerField(default=0)
    total_victorias = models.IntegerField(default=0)
    total_derrotas = models.IntegerField(default=0)
    total_abandonadas = models.IntegerField(default=0)
    puntaje_acumulado = models.IntegerField(default=0)
    promedio_tiempo = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    categoria_mas_jugada = models.ForeignKey(CategoriaJuego, on_delete=models.SET_NULL, null=True, blank=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Estadisticas_Jugador'

class CodigoOTP(models.Model):
    TIPO_CHOICES = [
        ('registro',     'Registro'),
        ('recuperacion', 'Recuperación'),
    ]
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='codigos_otp')
    codigo = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    tipo = models.CharField(max_length=12, choices=TIPO_CHOICES)

    class Meta:
        db_table = 'CodigoOTP'

    def __str__(self):
        return f"{self.usuario.nombre_usuario} — {self.tipo} — {self.codigo}"

