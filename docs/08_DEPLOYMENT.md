# Deployment y Configuración de Producción

## Requisitos del servidor

- Python 3.12+
- PostgreSQL 14+
- Nginx
- Gunicorn
- Linux (Ubuntu 22.04+ o similar)

## Variables de entorno

Todas las configuraciones sensibles se pasan por variables de entorno (archivo `.env` en desarrollo, variables de entorno del sistema en producción).

### Variables requeridas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `SECRET_KEY` | Django secret key — larga y aleatoria, nunca en el repo | `django-insecure-...` |
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/poligono_db` |
| `DEBUG` | Modo debug — **siempre False en prod** | `False` |
| `ALLOWED_HOSTS` | Hosts permitidos (CSV) | `api.ejemplo.mil,localhost` |

### Variables de seguridad

| Variable | Descripción | Default / Recomendado |
|---|---|---|
| `CORS_ALLOWED_ORIGINS` | Orígenes CORS (CSV) | `https://app.ejemplo.mil` |
| `CSRF_TRUSTED_ORIGINS` | Orígenes CSRF confiables (CSV) | `https://app.ejemplo.mil` |
| `JWT_COOKIE_SECURE` | Cookie secure (solo HTTPS) | `True` en prod |
| `JWT_COOKIE_SAMESITE` | SameSite policy | `Lax` |

### Variables de correo (recuperación de contraseña)

| Variable | Descripción |
|---|---|
| `EMAIL_HOST` | Servidor SMTP |
| `EMAIL_PORT` | Puerto SMTP |
| `EMAIL_USE_TLS` | Usar TLS (recomendado: `True`) |
| `EMAIL_HOST_USER` | Usuario SMTP |
| `EMAIL_HOST_PASSWORD` | Contraseña SMTP |

### Variables opcionales

| Variable | Descripción | Default |
|---|---|---|
| `DEFAULT_TEMP_PASSWORD` | Contraseña temporal para usuarios nuevos | `User1234` |
| `AXES_FAILURE_LIMIT` | Intentos fallidos antes del bloqueo | `5` |
| `AXES_COOLOFF_MINUTES` | Minutos de bloqueo | `30` (dev) / `60` (prod) |

## Checklist de producción

### Django

```bash
# Verificar configuración
python manage.py check --deploy

# Recolectar archivos estáticos
python manage.py collectstatic --noinput

# Aplicar migraciones
python manage.py migrate
```

### Inicializar el sistema (primera vez)

```bash
python manage.py init_access_model --tenant-code <codigo> --tenant-name "<nombre>"
python manage.py crear_master --rut <rut> --password <password-seguro> --tenant-code <codigo>
python manage.py seed_positions --tenant-code <codigo>
```

## Configuración de Gunicorn

Archivo de configuración `/etc/systemd/system/poligono.service`:

```ini
[Unit]
Description=PoligonoTiro Django Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ControlPoligono
EnvironmentFile=/var/www/ControlPoligono/.env
ExecStart=/var/www/ControlPoligono/.venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/log/gunicorn/access.log \
    --error-logfile /var/log/gunicorn/error.log \
    control_poligono.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable poligono
sudo systemctl start poligono
```

## Configuración de Nginx

Archivo `/etc/nginx/sites-available/poligono`:

```nginx
server {
    listen 443 ssl;
    server_name api.ejemplo.mil;

    ssl_certificate     /etc/letsencrypt/live/api.ejemplo.mil/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ejemplo.mil/privkey.pem;

    # Seguridad TLS
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /static/ {
        alias /var/www/ControlPoligono/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name api.ejemplo.mil;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/poligono /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Configuración de PostgreSQL

```sql
-- Crear base de datos y usuario
CREATE DATABASE poligono_db;
CREATE USER poligono_user WITH PASSWORD 'password-seguro';
ALTER ROLE poligono_user SET client_encoding TO 'utf8';
ALTER ROLE poligono_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE poligono_user SET timezone TO 'America/Santiago';
GRANT ALL PRIVILEGES ON DATABASE poligono_db TO poligono_user;
```

Variable de entorno:
```
DATABASE_URL=postgresql://poligono_user:password-seguro@localhost:5432/poligono_db
```

## Backups

### Base de datos

```bash
# Backup diario con cron
pg_dump -U poligono_user poligono_db > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U poligono_user poligono_db < backup_20260101.sql
```

Las migraciones de datos destructivas (`0005_remove_civil_roles`, `0002_military_only`, `0003_backfill_positions`) son **irreversibles** desde Django — solo restaurables desde backup.

## Monitoreo

### Logs importantes

```bash
# Errores de Gunicorn
tail -f /var/log/gunicorn/error.log

# Accesos de Nginx
tail -f /var/log/nginx/access.log

# Audit log del sistema (desde la API)
GET /api/auth/audit-log/   (requiere tenant_admin)
```

### Health check

```bash
curl -f https://api.ejemplo.mil/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"rut":"test","password":"test"}' \
  2>/dev/null | grep -q "rut" && echo "OK" || echo "DOWN"
```

## Actualizaciones

```bash
# 1. Hacer backup
pg_dump -U poligono_user poligono_db > backup_pre_update_$(date +%Y%m%d).sql

# 2. Desplegar nuevo código
git pull origin main

# 3. Instalar dependencias nuevas
.venv/bin/pip install -r requirements.txt

# 4. Aplicar migraciones
.venv/bin/python manage.py migrate

# 5. Re-inicializar modelo de acceso (idempotente, aplica cambios de permisos)
.venv/bin/python manage.py init_access_model --tenant-code <codigo> --tenant-name "<nombre>"

# 6. Recolectar estáticos
.venv/bin/python manage.py collectstatic --noinput

# 7. Reiniciar servicio
sudo systemctl restart poligono
```

## Diferencias desarrollo vs producción

| Configuración | Desarrollo | Producción |
|---|---|---|
| `DEBUG` | `True` | `False` |
| Base de datos | SQLite | PostgreSQL |
| `JWT_COOKIE_SECURE` | `False` | `True` |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Dominio real |
| Servidor | `runserver` | Gunicorn + Nginx |
| CORS | `localhost:3000,5173` | Dominio del frontend |
