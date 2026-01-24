# Departamento Piso 3 - Sistema de Gestión de Tareas

Sistema web para gestionar turnos de compras (botellón de agua, lava platos, aseo general) y registrar tareas diarias de lavado/secado de platos entre roommates.

## 🚀 Características

- **Turnos de Compra**: Rotación automática con bloqueo secuencial
- **Notificaciones por Email**: Recordatorios 2 días antes del vencimiento (configurable)
- **Duraciones Flexibles**: Ajusta según consumo real
- **Registro de Platos**: Calendario semanal de quién lava/seca
- **Panel Admin**: Desbloquear turnos y configurar usuarios
- **Responsive**: Optimizado para móvil y desktop

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database**: PostgreSQL (Vercel Postgres o Supabase)
- **Autenticación**: JWT con cookies HTTP-only
- **Deployment**: Vercel

## 📦 Instalación Local

### 1. Clonar repositorio

```bash
git clone <tu-repo>
cd departamento-piso3
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

Variables requeridas:
- `POSTGRES_URL`: URL de conexión a PostgreSQL (Vercel Postgres o Supabase)
- `AUTH_SECRET`: Secret para JWT (genera con `openssl rand -base64 32`)

### 4. Configurar base de datos

Ejecuta el schema SQL en tu Vercel Postgres:

```bash
# Conéctate a tu base de datos y ejecuta:
psql $POSTGRES_URL -f schema.sql
```

O desde el dashboard de Vercel Storage > Postgres > Query.

### 5. Generar contraseñas hasheadas

Las contraseñas en `schema.sql` son placeholders. Genera hashes reales:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('depto123', 10));"
```

Actualiza la tabla `users` con los hashes generados.

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

**Login por defecto:**
- Usuario: `erick`
- Contraseña: `depto123`

## 🚀 Deployment en Vercel

### 1. Conectar repositorio

- Ve a [vercel.com](https://vercel.com)
- Importa tu repositorio de GitHub
- Vercel detectará Next.js automáticamente

### 2. Configurar Vercel Postgres

- En el dashboard de Vercel, ve a **Storage** > **Create Database**
- Selecciona **Postgres**
- Conéctalo a tu proyecto
- Vercel agregará automáticamente las variables `POSTGRES_*`

### 3. Ejecutar schema SQL

- Ve a **Storage** > tu base de datos > **Query**
- Copia y pega el contenido de `schema.sql`
- Ejecuta el script

### 4. Agregar variables de entorno

En **Settings** > **Environment Variables**, agrega:

```
AUTH_SECRET=tu-secret-generado-con-openssl
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### 5. Deploy

```bash
git push origin main
```

Vercel desplegará automáticamente.

## 📚 Estructura del Proyecto

```
departamento-piso3/
├── app/
│   ├── api/
│   │   ├── auth/           # Login, logout, session
│   │   ├── supplies/       # CRUD de suministros
│   │   ├── dishes/         # Registro de platos
│   │   └── users/          # Gestión de usuarios
│   ├── dashboard/          # Dashboard principal
│   ├── dishes/             # Calendario de platos
│   ├── settings/           # Configuración
│   ├── login/              # Página de login
│   └── layout.tsx          # Layout raíz
├── lib/
│   ├── db.ts               # Helpers de base de datos
│   └── auth.ts             # Autenticación JWT
├── middleware.ts           # Protección de rutas
├── schema.sql              # Schema de base de datos
└── .env.example            # Ejemplo de variables
```

## 🎯 Funcionalidades Principales

### Turnos de Compra

- **Bloqueo Secuencial**: Solo el usuario asignado puede marcar su compra
- **Rotación Automática**: Al completar, pasa al siguiente en el orden
- **Alertas Visuales**: Verde (>3 días), Amarillo (2-3 días), Rojo (<2 días)
- **Forzar Turno (Admin)**: Desbloquear y avanzar si alguien olvidó marcar

### Registro de Platos

- **Calendario Semanal**: Vista de lunes a domingo
- **Acciones**: Lavar, Secar, o Ambas
- **Resumen**: Contador de tareas por persona
- **Edición**: Agregar/eliminar registros fácilmente

### Configuración

- **Duraciones Ajustables**: Modifica días según consumo real
- **Preferencias de Usuario**: Configuración personalizada por roommate
- **Panel Admin**: Gestionar configuración de todos los usuarios

## 🔒 Seguridad

- **JWT con cookies HTTP-only**: Sesiones seguras
- **Middleware de Next.js**: Protección de rutas privadas
- **Cron Secret**: Endpoint de notificaciones protegido
- **Passwords hasheados**: bcrypt con 10 rounds
- **HTTPS only en producción**: Cookies secure

## 🔧 Mantenimiento

### Actualizar duraciones basadas en historial

El sistema calcula automáticamente la duración real cada vez que alguien marca una compra. Revisa `supply_history.actual_duration_days` para ajustar.

### Cambiar orden de rotación

Actualiza el array `rotation_order` en la tabla `supplies`:

```sql
UPDATE supplies 
SET rotation_order = ARRAY[1, 3, 2, 4] 
WHERE id = 1;
```

### Agregar nuevo usuario

```sql
INSERT INTO users (name, email, username, password_hash, is_admin) 
VALUES ('Nuevo Roommate', 'email@example.com', 'username', 'hash', false);
```

Luego actualiza `rotation_order` en los suministros.

### Cambiar admin

```sql
UPDATE users SET is_admin = TRUE WHERE id = X;
```

## 📝 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/session` | Obtener sesión actual |
| GET | `/api/supplies` | Listar suministros |
| POST | `/api/supplies/complete` | Marcar compra |
| PATCH | `/api/supplies/duration` | Actualizar duración |
| POST | `/api/admin/unlock` | Forzar turno (admin) |
| GET | `/api/dishes` | Listar registros de platos |
| POST | `/api/dishes` | Crear registro |
| DELETE | `/api/dishes` | Eliminar registro |
| GET | `/api/users` | Listar usuarios |
| PATCH | `/api/users/notification-days` | Actualizar preferencias |

## 🐛 Troubleshooting

### Error de conexión a base de datos

1. Verifica que la variable `POSTGRES_URL` esté configurada
2. En local, usa `POSTGRES_URL` en `.env.local`
3. Verifica que la base de datos esté accesible
4. Revisa logs de Vercel Functions si está en producción

### Error al iniciar sesión

1. Verifica que ejecutaste el `schema.sql` correctamente
2. Verifica que las contraseñas estén hasheadas (no uses placeholders)
3. Genera hash con: `node -e "console.log(require('bcryptjs').hashSync('depto123', 10))"`
4. Actualiza en la BD: `UPDATE users SET password_hash = 'TU_HASH' WHERE username = 'erick';`

## 📄 Licencia

Proyecto privado para uso interno del Departamento Piso 3.

## 👥 Autores

Desarrollado con ❤️ para los roommates del Piso 3.
