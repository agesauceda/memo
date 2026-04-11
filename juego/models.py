from django.db import models  # Importa el módulo de modelos de Django

class Rango(models.Model):  # Define el modelo Rango que hereda de Model
    nombre = models.CharField(max_length=20)  # Campo para el nombre del rango, cadena de hasta 20 caracteres
    puntaje_min = models.IntegerField(default=0)  # Campo para el puntaje mínimo, entero con valor por defecto 0
    puntaje_max = models.IntegerField()  # Campo para el puntaje máximo, entero
    orden = models.SmallIntegerField()  # Campo para el orden, entero pequeño

    class Meta:  # Clase Meta para opciones del modelo
        db_table = 'Rangos'  # Especifica el nombre de la tabla en la base de datos

class Usuario (models.Model):  # Define el modelo Usuario que hereda de Model
    nombre = models.CharField(max_length=50)  # Campo para el nombre, cadena de hasta 50 caracteres
    apellido = models.CharField(max_length=50)  # Campo para el apellido, cadena de hasta 50 caracteres
    telefono = models.CharField(max_length=15, null=True, blank=True)  # Campo para el teléfono, cadena opcional de hasta 15 caracteres
    correo_electronico = models.CharField(max_length=100, unique=True)  # Campo para el correo electrónico, cadena única de hasta 100 caracteres
    nombre_usuario = models.CharField(max_length=50, unique=True)  # Campo para el nombre de usuario, cadena única de hasta 50 caracteres
    contrasena = models.CharField(max_length=255)  # Campo para la contraseña, cadena de hasta 255 caracteres
    rango = models.ForeignKey(Rango, on_delete=models.SET_NULL, null=True, related_name='usuarios')  # Clave foránea al modelo Rango, se establece en null al eliminar
    fecha_registro = models.DateTimeField(auto_now_add=True)  # Campo para la fecha de registro, se establece automáticamente al crear
    activo = models.BooleanField(default=True)  # Campo booleano para indicar si el usuario está activo, por defecto True
    avatar = models.CharField(max_length=255, null=True, blank=True)  # Campo para la ruta del avatar, cadena opcional de hasta 255 caracteres


    def toDict(self):  # Método para convertir el objeto a diccionario
        return {  # Retorna un diccionario con los datos del usuario
            "id": self.id,  # ID del usuario
            "nombre": self.nombre,  # Nombre del usuario
            "apellido": self.apellido,  # Apellido del usuario
            "nombre_usuario": self.nombre_usuario,  # Nombre de usuario
            "rango": self.rango.nombre if self.rango else "Sin Rango",  # Nombre del rango o "Sin Rango" si no tiene
            "fecha_registro": self.fecha_registro.strftime("%d/%m/%Y") if self.fecha_registro else "—",  # Fecha de registro formateada o guion si no hay
            "avatar": self.avatar or "",  # Ruta del avatar o cadena vacía si no tiene
        }
    
    class Meta:  # Clase Meta para opciones del modelo
        db_table = 'Usuario'  # Especifica el nombre de la tabla en la base de datos

class Sesion(models.Model):  # Define el modelo Sesion que hereda de Model
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='sesion')  # Clave foránea al modelo Usuario, se elimina en cascada
    fecha_inicio_sesion = models.DateTimeField(auto_now_add=True)  # Campo para la fecha de inicio de sesión, se establece automáticamente
    fecha_cierre_sesion = models.DateTimeField(null=True, blank=True)  # Campo para la fecha de cierre de sesión, opcional
    hora_inicio_sesion = models.TimeField(null=True, blank=True)  # Campo para la hora de inicio de sesión, opcional
    hora_cierre_sesion = models.TimeField(null=True, blank=True)  # Campo para la hora de cierre de sesión, opcional

    class Meta:  # Clase Meta para opciones del modelo
        db_table = 'Sesion'  # Especifica el nombre de la tabla en la base de datos

class CategoriaJuego(models.Model):  # Define el modelo CategoriaJuego que hereda de Model
    nombre = models.CharField(max_length=20, unique=True)  # Campo para el nombre de la categoría, cadena única de hasta 20 caracteres
    intentos_max = models.SmallIntegerField()  # Campo para el máximo de intentos, entero pequeño
    tiempo_limite = models.SmallIntegerField()  # Campo para el tiempo límite, entero pequeño
    filas = models.SmallIntegerField(default=4)  # Campo para el número de filas, entero pequeño con valor por defecto 4
    columnas = models.SmallIntegerField(default=4)  # Campo para el número de columnas, entero pequeño con valor por defecto 4

    class Meta:  # Clase Meta para opciones del modelo
        db_table = 'Categorias_Juego'  # Especifica el nombre de la tabla en la base de datos

class Carta(models.Model):  # Define el modelo Carta que hereda de Model
    categoria = models.ForeignKey(CategoriaJuego, on_delete=models.CASCADE, related_name='cartas')  # Clave foránea a CategoriaJuego, se elimina en cascada
    par_id = models.SmallIntegerField()  # Campo para el ID del par, entero pequeño
    nombre_carta = models.CharField(max_length=50)  # Campo para el nombre de la carta, cadena de hasta 50 caracteres
    ruta_imagen = models.CharField(max_length=200)  # Campo para la ruta de la imagen, cadena de hasta 200 caracteres
    activa = models.BooleanField(default=True)  # Campo booleano para indicar si la carta está activa, por defecto True

    class Meta:  # Clase Meta para opciones del modelo
        db_table = 'Cartas'  # Especifica el nombre de la tabla en la base de datos

class Partida(models.Model):  # Define el modelo Partida que hereda de Model
    ESTADOS = [  # Lista de tuplas para las opciones de estado
        ('Ganada', 'Ganada'),  # Opción para estado Ganada
        ('Perdida', 'Perdida'),  # Opción para estado Perdida
        ('Abandonada', 'Abandonada'),  # Opción para estado Abandonada
    ]
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='partidas')  # Clave foránea a Usuario, se elimina en cascada
    categoria = models.ForeignKey(CategoriaJuego, on_delete=models.RESTRICT, related_name='partidas')  # Clave foránea a CategoriaJuego, restringe eliminación
    estado = models.CharField(max_length=10, choices=ESTADOS)  # Campo para el estado, cadena con opciones definidas
    tiempo_jugado = models.SmallIntegerField(default=0)  # Campo para el tiempo jugado, entero pequeño con valor por defecto 0
    movimientos = models.SmallIntegerField(default=0)  # Campo para los movimientos, entero pequeño con valor por defecto 0
    intentos_realizados = models.SmallIntegerField(default=0)  # Campo para los intentos realizados, entero pequeño con valor por defecto 0
    puntaje = models.IntegerField(default=0)  # Campo para el puntaje, entero con valor por defecto 0
    fecha_partida = models.DateTimeField(auto_now_add=True)  # Campo para la fecha de la partida, se establece automáticamente

    class Meta:  # Clase Meta para opciones del modelo
        db_table = 'Partida'  # Especifica el nombre de la tabla en la base de datos

class EstadisticaJugador(models.Model):  # Define el modelo EstadisticaJugador que hereda de Model
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='estadisticas')  # Clave foránea uno a uno a Usuario, se elimina en cascada
    total_partidas = models.IntegerField(default=0)  # Campo para el total de partidas, entero con valor por defecto 0
    total_victorias = models.IntegerField(default=0)  # Campo para el total de victorias, entero con valor por defecto 0
    total_derrotas = models.IntegerField(default=0)  # Campo para el total de derrotas, entero con valor por defecto 0
    total_abandonadas = models.IntegerField(default=0)  # Campo para el total de abandonadas, entero con valor por defecto 0
    puntaje_acumulado = models.IntegerField(default=0)  # Campo para el puntaje acumulado, entero con valor por defecto 0
    promedio_tiempo = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)  # Campo para el promedio de tiempo, decimal con 6 dígitos y 2 decimales, por defecto 0.00
    categoria_mas_jugada = models.ForeignKey(CategoriaJuego, on_delete=models.SET_NULL, null=True, blank=True)  # Clave foránea a CategoriaJuego, se establece en null al eliminar
    ultima_actualizacion = models.DateTimeField(auto_now=True)  # Campo para la última actualización, se actualiza automáticamente

    class Meta:  # Clase Meta para opciones del modelo
        db_table = 'Estadisticas_Jugador'  # Especifica el nombre de la tabla en la base de datos

class CodigoOTP(models.Model):  # Define el modelo CodigoOTP que hereda de Model
    TIPO_CHOICES = [  # Lista de tuplas para las opciones de tipo de código OTP
        ('registro',     'Registro'),  # Opción para tipo registro
        ('recuperacion', 'Recuperación'),  # Opción para tipo recuperación
    ]
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='codigos_otp')  # Clave foránea a Usuario, se elimina en cascada
    codigo = models.CharField(max_length=4)  # Campo para el código OTP, cadena de hasta 4 caracteres
    created_at = models.DateTimeField(auto_now_add=True)  # Campo para la fecha de creación, se establece automáticamente
    used = models.BooleanField(default=False)  # Campo booleano para indicar si el código ha sido usado, por defecto False
    tipo = models.CharField(max_length=12, choices=TIPO_CHOICES)  # Campo para el tipo, cadena con opciones definidas

    class Meta:  # Clase Meta para opciones del modelo
        db_table = 'CodigoOTP'  # Especifica el nombre de la tabla en la base de datos

    def __str__(self):  # Método para representar el objeto como cadena
        return f"{self.usuario.nombre_usuario} — {self.tipo} — {self.codigo}"  # Retorna una cadena con nombre de usuario, tipo y código

