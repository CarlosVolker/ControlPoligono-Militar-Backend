from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta


class DSTheme(models.TextChoices):
    DARK = "dark"
    LIGHT = "light"


class DSAccent(models.TextChoices):
    VIOLET = "violet"
    GREEN = "green"
    AMBER = "amber"
    BLUE = "blue"
    PINK = "pink"
    TEAL = "teal"
    ORANGE = "orange"
    RED = "red"
    CYAN = "cyan"
    LIME = "lime"
    INDIGO = "indigo"
    FUCHSIA = "fuchsia"
    SKY = "sky"
    ROSE = "rose"
    EMERALD = "emerald"
    GOLD = "gold"
    OLIVE = "olive"
    SIGNAL = "signal"
    STEEL = "steel"
    MINT = "mint"
    COPPER = "copper"
    NVG = "nvg"
    KHAKI = "khaki"
    GUNMETAL = "gunmetal"
    WRAITH = "wraith"
    SENTINEL = "sentinel"
    SONAR = "sonar"


class DSBg(models.TextChoices):
    NEUTRAL = "neutral"
    ABYSS = "abyss"
    FERN = "fern"
    EMBER = "ember"
    MIDNIGHT = "midnight"
    WINE = "wine"
    SLATE = "slate"
    SAND = "sand"
    FIELD = "field"
    COMMAND = "command"
    FORGE = "forge"
    GLACIER = "glacier"
    ORCHID = "orchid"
    CLAY = "clay"
    BLACKOUT = "blackout"
    CARBON = "carbon"
    OBSIDIAN = "obsidian"
    BUNKER = "bunker"
    TRENCH = "trench"
    PURE = "pure"
    STONE = "stone"
    ZINC = "zinc"
    MAUVE = "mauve"
    SAGE = "sage"
    MIST = "mist"
    TAUPE = "taupe"


class DSFont(models.TextChoices):
    PLAY = "play"
    TITILLIUM = "titillium"
    EXO2 = "exo2"
    RAJDHANI = "rajdhani"
    IBM_PLEX = "ibm-plex"
    INTER = "inter"
    MANROPE = "manrope"
    PUBLIC_SANS = "public-sans"
    GEIST = "geist"


class DSRadius(models.TextChoices):
    SOFT = "soft"
    SUBTLE = "subtle"
    SQUARE = "square"


class DSIconfam(models.TextChoices):
    DEFAULT = "default"
    MINGCUTE = "mingcute"
    SOLAR = "solar"
    MDI = "mdi"
    FA7_SOLID = "fa7-solid"
    PHOSPHOR = "phosphor"
    LUCIDE = "lucide"


class DSAmbient(models.TextChoices):
    EMBERS = "embers"
    FIREFLIES = "fireflies"
    RAIN = "rain"
    SEARCHLIGHTS = "searchlights"
    TRACERS = "tracers"
    RICOCHET = "ricochet"
    ASH = "ash"
    OFF = "off"


class DSAmbcolor(models.TextChoices):
    ACCENT = "accent"
    EMBER = "ember"
    GOLD = "gold"
    LIME = "lime"
    MINT = "mint"
    CYAN = "cyan"
    VIOLET = "violet"


# Extensión del modelo de Usuario de Django
class Usuario(AbstractUser):
    id_usuario = models.BigAutoField(primary_key=True)
    rut = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=50, default="")
    apellido_paterno = models.CharField(max_length=50)
    apellido_materno = models.CharField(max_length=50)
    correo = models.EmailField(max_length=100, null=True, blank=True)
    grado = models.CharField(max_length=50, null=True, blank=True)

    # Preferencias de apariencia visual
    THEME_CHOICES = [
        ('nexus-light', 'Nexus Light'),
        ('nexus-dark', 'Nexus Dark'),
    ]
    PALETTE_CHOICES = [
        ('corporate-blue', 'Corporate Blue'),
        ('military-teal', 'Military Teal'),
        ('neutral-slate', 'Neutral Slate'),
    ]
    DENSITY_CHOICES = [
        ('comfortable', 'Comfortable'),
        ('compact', 'Compact'),
    ]

    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='nexus-light')
    palette = models.CharField(max_length=20, choices=PALETTE_CHOICES, default='corporate-blue')
    density = models.CharField(max_length=20, choices=DENSITY_CHOICES, default='comfortable')

    ds_theme = models.CharField(max_length=16, choices=DSTheme.choices, default="dark", null=False, blank=False)
    ds_accent = models.CharField(max_length=16, choices=DSAccent.choices, default="mint", null=False, blank=False)
    ds_bg = models.CharField(max_length=16, choices=DSBg.choices, default="command", null=False, blank=False)
    ds_font = models.CharField(max_length=16, choices=DSFont.choices, default="ibm-plex", null=False, blank=False)
    ds_radius = models.CharField(max_length=16, choices=DSRadius.choices, default="square", null=False, blank=False)
    ds_iconfam = models.CharField(max_length=16, choices=DSIconfam.choices, default="phosphor", null=False, blank=False)
    ds_ambient = models.CharField(max_length=16, choices=DSAmbient.choices, default="embers", null=False, blank=False)
    ds_ambcolor = models.CharField(max_length=16, choices=DSAmbcolor.choices, default="accent", null=False, blank=False)

    # Onboarding seguro: forzar cambio de contrasena temporal en primer login.
    must_change_password = models.BooleanField(default=False)
    password_changed_at = models.DateTimeField(null=True, blank=True)

    # Tirador "fantasma": existe solo para registrar resultados de tiro de personal
    # cuya cuenta formal aun no se creo (ej: invitado externo, personal nuevo aun
    # sin Account). Cuando el admin crea formalmente al usuario con el mismo RUT,
    # el sistema PROMUEVE este registro (link a Account+Assignment) en vez de
    # duplicar. Mientras es temporal, NO puede loguearse (is_active=False y sin
    # password).
    is_temporary = models.BooleanField(default=False)

    class Meta(AbstractUser.Meta):
        abstract = False
        constraints = [
            *AbstractUser._meta.constraints,
            models.CheckConstraint(
                condition=models.Q(ds_theme__in=DSTheme.values),
                name="usuario_ds_theme_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(ds_accent__in=DSAccent.values),
                name="usuario_ds_accent_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(ds_bg__in=DSBg.values),
                name="usuario_ds_bg_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(ds_font__in=DSFont.values),
                name="usuario_ds_font_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(ds_radius__in=DSRadius.values),
                name="usuario_ds_radius_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(ds_iconfam__in=DSIconfam.values),
                name="usuario_ds_iconfam_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(ds_ambient__in=DSAmbient.values),
                name="usuario_ds_ambient_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(ds_ambcolor__in=DSAmbcolor.values),
                name="usuario_ds_ambcolor_valid",
            ),
        ]

    def __str__(self):
        return f"{self.grado} {self.apellido_paterno} {self.apellido_materno}, {self.nombre}"

TIPO_ARMA_CHOICES = [
    ('fusil',         'Fusil de Asalto / Carabina'),
    ('subfusil',      'Subfusil'),
    ('pistola',       'Pistola'),
    ('francotirador', 'Fusil de Precisión / Francotirador'),
    ('ametralladora', 'Ametralladora'),
    ('apoyo',         'Armamento de Apoyo'),
]


class Calibre(models.Model):
    id_calibre = models.AutoField(primary_key=True)
    code = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=60)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return self.nombre


# Modelo Armas
class Arma(models.Model):
    id_arma = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.PROTECT, null=True, blank=True, related_name='armas')
    # organization_unit queda por compatibilidad. La fuente de verdad es ahora
    # `armory`: la unidad se deriva de armory.organization_unit. La migracion
    # de data 0016 mueve cada arma a un Armory default por unidad.
    organization_unit = models.ForeignKey('organizations.OrganizationUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='armas')
    armory = models.ForeignKey('armory.Armory', on_delete=models.PROTECT, null=True, blank=True, related_name='armas')
    calibre = models.ForeignKey(Calibre, on_delete=models.PROTECT, null=True, blank=True, related_name='armas')
    tipo_arma = models.CharField(max_length=50, choices=TIPO_ARMA_CHOICES)
    modelo_arma = models.CharField(max_length=50)
    numero_serie = models.CharField(max_length=50)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['modelo_arma', 'numero_serie'], name='unique_modelo_numeroserie')
        ]
        
    def __str__(self):
        return f"{self.tipo_arma} - {self.modelo_arma} - {self.numero_serie}" 

        
# Modelo PoligonoTiro
class PoligonoTiro(models.Model):
    id_poligono = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.PROTECT, null=True, blank=True, related_name='poligonos')
    organization_unit = models.ForeignKey('organizations.OrganizationUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='poligonos')
    nombre = models.CharField(max_length=50)
    ciudad = models.CharField(max_length=30)
    carriles_maximos = models.IntegerField()
    distancia_maxima = models.IntegerField()
    
    def __str__(self):
        return f"Polígono: {self.nombre} - Ciudad: {self.ciudad}"

# Modelo LeccionesTiro
class LeccionTiro(models.Model):
    id_leccion = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.PROTECT, null=True, blank=True, related_name='lecciones')
    organization_unit = models.ForeignKey('organizations.OrganizationUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='lecciones')
    id_poligono = models.ForeignKey(PoligonoTiro, on_delete=models.CASCADE)
    fecha_tiro = models.DateField()
    numero_orden = models.CharField(max_length=15, null=True, blank=True)
    fecha_orden = models.DateField(null=True, blank=True)
    TIPOS_TIRO = [
        ('evaluacion', 'Evaluación'),
        ('entrenamiento', 'Entrenamiento'),
    ]
    tipo_tiro = models.CharField(max_length=20, choices=TIPOS_TIRO, null=True, blank=True)
    cant_tiros_cereo = models.IntegerField()
    cant_tiros_leccion = models.IntegerField()
    distancia = models.IntegerField()
    # Unidades cuyos miembros pueden ser agregados como tiradores a esta leccion.
    # Permite cruzar ramas/escalafones (ej. un Batallon evaluando al Centro Clinico
    # Militar). Si se deja vacio, default es la unidad del creador (se setea en el
    # serializer).
    unidades_participantes = models.ManyToManyField(
        'organizations.OrganizationUnit',
        blank=True,
        related_name='lecciones_donde_participa',
    )
    
    def __str__(self):
        return f"Fecha Tiro: {self.fecha_tiro} - Polígono: {self.id_poligono.nombre}"
    
# Modelo FraccionesTiro
class FraccionTiro(models.Model):
    id_fraccion = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.PROTECT, null=True, blank=True, related_name='fracciones')
    organization_unit = models.ForeignKey('organizations.OrganizationUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='fracciones')
    id_leccion = models.ForeignKey(LeccionTiro, on_delete=models.CASCADE)
    tiradores_totales = models.IntegerField()
    numero_fraccion = models.IntegerField()
    
    class Meta:
        constraints = [
            #models.UniqueConstraint(fields=['id_leccion', 'tiradores_totales'], name='unique_leccion_tiradores'),
            models.UniqueConstraint(fields=['id_leccion', 'numero_fraccion'], name='unique_leccion_numero_fraccion')
        ]
             
    def __str__(self):
        return f"Lección: {self.id_leccion.id_leccion} - Cantidad Tiradores: {self.tiradores_totales}"

# Modelo ResultadoTiro
class ResultadoTiro(models.Model):
    id_resultado = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.PROTECT, null=True, blank=True, related_name='resultados')
    organization_unit = models.ForeignKey('organizations.OrganizationUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='resultados')
    id_fraccion = models.ForeignKey(FraccionTiro, on_delete=models.CASCADE)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)  # Relación con Usuario
    id_arma = models.ForeignKey(Arma, on_delete=models.CASCADE)
    tiros_acertados = models.IntegerField()
    total_tiros = models.IntegerField()
    numero_carril = models.IntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            # Una persona no puede estar dos veces en la misma fraccion (no se
            # divide en dos carriles).
            models.UniqueConstraint(
                fields=['id_fraccion', 'id_usuario'],
                name='unique_fraccion_usuario',
            ),
            # Un arma no puede estar dos veces en la misma fraccion (no se usa
            # en dos carriles a la vez).
            models.UniqueConstraint(
                fields=['id_fraccion', 'id_arma'],
                name='unique_fraccion_arma',
            ),
            # Un carril no puede tener dos resultados en la misma fraccion. Solo
            # aplica cuando numero_carril no es null (carriles "no asignados"
            # quedan exentos del check).
            models.UniqueConstraint(
                fields=['id_fraccion', 'numero_carril'],
                name='unique_fraccion_carril',
                condition=models.Q(numero_carril__isnull=False),
            ),
        ]


class EjercicioMilitar(models.Model):
    id_ejercicio = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.PROTECT, null=True, blank=True, related_name='ejercicios')
    organization_unit = models.ForeignKey('organizations.OrganizationUnit', on_delete=models.PROTECT, null=True, blank=True, related_name='ejercicios')
    nombre = models.CharField(max_length=120)
    fecha = models.DateField()
    zona = models.CharField(max_length=150, blank=True)
    TIPO_EJERCICIO_CHOICES = [
        ('asalto',     'Asalto'),
        ('defensa',    'Defensa'),
        ('movimiento', 'Movimiento'),
        ('mixto',      'Mixto'),
        ('otro',       'Otro'),
    ]
    tipo_ejercicio = models.CharField(max_length=30, choices=TIPO_EJERCICIO_CHOICES, blank=True)
    numero_orden = models.CharField(max_length=15, null=True, blank=True)
    fecha_orden = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    unidades_participantes = models.ManyToManyField(
        'organizations.OrganizationUnit',
        blank=True,
        related_name='ejercicios_donde_participa',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} - {self.fecha}"


class ConsumoMunicion(models.Model):
    id_consumo = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.PROTECT, null=True, blank=True, related_name='consumos_municion')
    ejercicio = models.ForeignKey(EjercicioMilitar, on_delete=models.CASCADE, related_name='consumos')
    tipo_arma = models.CharField(max_length=50, choices=TIPO_ARMA_CHOICES)
    modelo_arma = models.CharField(max_length=50, blank=True)
    calibre = models.ForeignKey(Calibre, on_delete=models.PROTECT, related_name='consumos')
    cantidad_armas = models.PositiveIntegerField(null=True, blank=True)
    cantidad_tiros = models.PositiveIntegerField()
    es_aproximado = models.BooleanField(default=True)
    observaciones = models.TextField(blank=True)

    def __str__(self):
        return f"{self.get_tipo_arma_display()} {self.calibre} - {self.cantidad_tiros} tiros"


class ConsumoArma(models.Model):
    id_consumo_arma = models.AutoField(primary_key=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.PROTECT, null=True, blank=True, related_name='consumos_arma')
    consumo = models.ForeignKey(ConsumoMunicion, on_delete=models.CASCADE, related_name='detalle_armas')
    arma = models.ForeignKey(Arma, on_delete=models.PROTECT, related_name='consumos_ejercicio')
    cantidad_tiros = models.PositiveIntegerField()
    observaciones = models.CharField(max_length=150, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['consumo', 'arma'], name='unique_consumo_arma'),
        ]

    def __str__(self):
        return f"Arma {self.arma.numero_serie} - {self.cantidad_tiros} tiros"


Usuario = get_user_model()
# Tabla para recuperar contraseña
class CodigoRecuperacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    codigo = models.CharField(max_length=6)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    #Esta funcion verifica si el código de recuperación ha expirado
    def esta_expirado(self):
        # aqui defino el tiempo de expiración
        tiempo_expiracion = timedelta(minutes=5)
        return timezone.now() > (self.creado_en + tiempo_expiracion)
