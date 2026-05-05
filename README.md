# Departamento Piso 3 - Sistema de Gestion de Tareas

Sistema web para gestionar turnos de compras (botellon de agua, lava platos, aseo general) y registrar tareas diarias de lavado/secado de platos entre roommates. Incluye autenticacion con JWT, API interna con App Router y panel de administracion.

## 🚀 Caracteristicas

- **Turnos de Compra**: Rotacion automatica con bloqueo secuencial
- **Notificaciones por Email**: Recordatorios 2 dias antes del vencimiento (configurable)
- **Duraciones Flexibles**: Ajusta segun consumo real
- **Registro de Platos**: Calendario semanal de quien lava/seca
- **Panel Admin**: Desbloquear turnos y configurar usuarios
- **Responsive**: Optimizado para movil y desktop

## 🛠️ Stack Tecnologico

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database**: PostgreSQL (Vercel Postgres o Supabase)
- **Autenticacion**: JWT con cookies HTTP-only
- **Deployment**: Vercel

## 🧭 Contexto y objetivo

El proyecto resuelve la rotacion de tareas recurrentes en un departamento: compras de suministros (con orden definido y bloqueo) y tareas diarias de platos. La logica principal vive en endpoints de la carpeta `app/api` y el frontend consume esas rutas mediante fetch desde paginas del App Router.

## 🧱 Arquitectura general

- **App Router**: Paginas en `app/` y rutas API en `app/api/`.
- **API interna**: Controla autenticacion, rotacion de suministros, y registro de platos.
- **Middleware**: Protege rutas privadas y redirecciona al login.
- **JWT en cookies**: Sesiones seguras con cookies HTTP-only.
- **PostgreSQL**: Persistencia de usuarios, suministros, historial y registros diarios.

## 📦 Instalacion Local

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
- `POSTGRES_URL`: URL de conexion a PostgreSQL (Vercel Postgres o Supabase)
- `AUTH_SECRET`: Secret para JWT (genera con `openssl rand -base64 32`)

Variables recomendadas:
- `NEXT_PUBLIC_APP_URL`: URL publica del sitio para construccion de enlaces
- `CRON_SECRET`: Token para proteger endpoints de tareas programadas (si aplica)

### 4. Configurar base de datos

Ejecuta el schema SQL en tu Vercel Postgres:

```bash
# Conéctate a tu base de datos y ejecuta:
psql $POSTGRES_URL -f schema.sql
```

O desde el dashboard de Vercel Storage > Postgres > Query.

### 5. Generar contrasenas hasheadas

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

## ▶️ Scripts utiles

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de produccion
- `npm run start`: servidor de produccion
- `npm run lint`: linting

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
│   └── auth.ts             # Autenticacion JWT
├── middleware.ts           # Proteccion de rutas
├── schema.sql              # Schema de base de datos
└── .env.example            # Ejemplo de variables
```

## 🎯 Funcionalidades Principales

### Turnos de Compra

- **Bloqueo Secuencial**: Solo el usuario asignado puede marcar su compra
- **Rotacion Automatica**: Al completar, pasa al siguiente en el orden
- **Alertas Visuales**: Verde (>3 dias), Amarillo (2-3 dias), Rojo (<2 dias)
- **Forzar Turno (Admin)**: Desbloquear y avanzar si alguien olvido marcar

### Registro de Platos

- **Calendario Semanal**: Vista de lunes a domingo
- **Acciones**: Lavar, Secar, o Ambas
- **Resumen**: Contador de tareas por persona
- **Edicion**: Agregar/eliminar registros facilmente

### Configuracion

- **Duraciones Ajustables**: Modifica dias segun consumo real
- **Preferencias de Usuario**: Configuracion personalizada por roommate
- **Panel Admin**: Gestionar configuracion de todos los usuarios

## 🧩 Rutas y paginas principales

- `/login`: Inicio de sesion
- `/dashboard`: Estado general y accesos rapidos
- `/dishes`: Calendario semanal de platos
- `/settings`: Preferencias y configuracion

## 🔐 Autenticacion y seguridad

- JWT con cookies HTTP-only
- Middleware protege rutas privadas y valida sesion
- Endpoint de logout limpia cookies
- Passwords hasheados con bcrypt (10 rounds)

## 🔒 Seguridad

- **JWT con cookies HTTP-only**: Sesiones seguras
- **Middleware de Next.js**: Proteccion de rutas privadas
- **Cron Secret**: Endpoint de notificaciones protegido
- **Passwords hasheados**: bcrypt con 10 rounds
- **HTTPS only en produccion**: Cookies secure

## 🔧 Mantenimiento

### Actualizar duraciones basadas en historial

El sistema calcula automaticamente la duracion real cada vez que alguien marca una compra. Revisa `supply_history.actual_duration_days` para ajustar.

### Cambiar orden de rotacion

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
| POST | `/api/auth/login` | Iniciar sesion |
| POST | `/api/auth/logout` | Cerrar sesion |
| GET | `/api/auth/session` | Obtener sesion actual |
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

### Error de conexion a base de datos

1. Verifica que la variable `POSTGRES_URL` este configurada
2. En local, usa `POSTGRES_URL` en `.env.local`
3. Verifica que la base de datos esté accesible
4. Revisa logs de Vercel Functions si esta en produccion

### Error al iniciar sesion

1. Verifica que ejecutaste el `schema.sql` correctamente
2. Verifica que las contrasenas esten hasheadas (no uses placeholders)
3. Genera hash con: `node -e "console.log(require('bcryptjs').hashSync('depto123', 10))"`
4. Actualiza en la BD: `UPDATE users SET password_hash = 'TU_HASH' WHERE username = 'erick';`

## 📌 Notas de desarrollo

- La logica de negocio vive en rutas API y se consume desde el frontend.
- Para pruebas locales, usa una base de datos real (Vercel Postgres o Supabase).
- Si agregas un nuevo roommate, recuerda actualizar el orden de rotacion en `supplies`.

## 📄 Licencia

Proyecto privado para uso interno del Departamento Piso 3.

## 👥 Autores

Desarrollado con ❤️ para los roommates del Piso 3.
