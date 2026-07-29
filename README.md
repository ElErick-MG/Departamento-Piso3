<div align="center">

# 🏠 Departamento Piso 3

### Sistema Integral de Gestión de Tareas, Suministros y Convivencia

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Vercel%2FSupabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

Plataforma web full-stack creada para automatizar y coordinar de forma equitativa las tareas del hogar, compras de insumos compartidos, turnos de aseo semanal, sorteos de botellón de agua y registro de platos entre roommates.

[Características](#-características-principales) •
[Arquitectura](#-arquitectura-del-sistema) •
[Stack Tecnológico](#-stack-tecnológico) •
[Modelo de Datos](#-modelo-de-datos-base-de-datos) •
[Instalación](#-instalación-y-configuración-local) •
[API Reference](#-referencia-de-api-endpoints) •
[Despliegue](#-despliegue-en-vercel)

---

</div>

## 📖 Tabla de Contenidos

- [📌 Visión General](#-visión-general)
- [✨ Características Principales](#-características-principales)
- [🏗 Arquitectura del Sistema](#-arquitectura-del-sistema)
- [🛠️ Stack Tecnológico](#-stack-tecnológico)
- [🗄️ Modelo de Datos (Base de Datos)](#-modelo-de-datos-base-de-datos)
- [🚀 Instalación y Configuración Local](#-instalación-y-configuración-local)
- [🔑 Variables de Entorno](#-variables-de-entorno)
- [📡 Referencia de API Endpoints](#-referencia-de-api-endpoints)
- [🧪 Pruebas y Scripts](#-pruebas-y-scripts)
- [🌐 Despliegue en Vercel](#-despliegue-en-vercel)
- [🔧 Mantenimiento y Consultas SQL](#-mantenimiento-y-consultas-sql)
- [👥 Autores y Licencia](#-autores-y-licencia)

---

## 📌 Visión General

Organizar la convivencia en un departamento compartido requiere una distribución transparente y justa de responsabilidades. **Departamento Piso 3** resuelve la gestión diaria mediante:

1. **Control de Suministros:** Rotación secuencial estricta para compras recurrentes (Botellones de agua, Detergentes, Aseo general) con bloqueo automático al turno activo.
2. **Responsabilidades Diarias:** Registro semanal interactivo de lavado y secado de platos por roommate.
3. **Organización del Aseo:** Asignación inteligente y equitativa de grupos de limpieza semanal por áreas designadas.
4. **Gamificación y Transparencia:** Ruleta del botellón para selección de responsable por ciclos e inventario de reservas personales.

---

## ✨ Características Principales

### 🔄 Turnos de Compra y Suministros

- **Bloqueo Secuencial Inteligente:** Únicamente el roommate asignado puede completar el turno actual.
- **Rotación Automática:** Al marcar la compra, el sistema calcula la duración real, registra el historial y avanza al siguiente integrante.
- **Semáforo de Estado Visual:**
  - 🟢 **Normal:** `> 3 días` restantes.
  - 🟡 **Próximo a Vencer:** `2 a 3 días` restantes.
  - 🔴 **Vencido / Alerta:** `< 2 días` restantes.
- **Ajuste de Duraciones Históricas:** Recalcula automáticamente la duración en días basándose en consumos reales previos.

### 🍽️ Registro de Platos

- **Calendario Semanal Interactivo:** Vista completa de lunes a domingo.
- **Acciones Disponibles:** `Lavar`, `Secar` o `Ambas`.
- **Resumen y Estadísticas:** Conteo semanal de tareas realizadas por roommate para equilibrar la carga laboral.

### 🧹 Grupos de Aseo Semanal

- **Asignación de Parejas o Tríos:** Distribución justa de roommates en turnos semanales (`group_size: 2` o `3`).
- **Catálogo de Áreas:** Ducha, tacho de basura/fundas, microondas, manteles, nevera, entre otros.
- **Pruebas Automatizadas:** Módulo testeado con Vitest para validar asignaciones equitativas sin repeticiones injustas.

### 🎯 Ruleta del Botellón de Agua

- **Sorteo por Ciclos:** Ruleta interactiva para determinar al comprador de botellones.
- **Confirmación Auditorable:** Registro del responsable, fecha de giro y confirmador del ciclo.

### 📦 Inventario Personal & Reservas

- **Gestión de Insumos:** Registro de productos individuales comprados por integrantes.
- **Categorización y Estado:** Clasificación por categorías con estados `active` y `consumed`.

### 🛡️ Autenticación y Control de Acceso

- **Seguridad HTTP-Only:** Tokens **JWT** almacenados en cookies seguras.
- **Middleware de Next.js:** Intercepción y protección de rutas privadas `/dashboard`, `/dishes`, `/cleaning`, `/reserves` y `/settings`.
- **Panel Administrativo:** Permisos especiales para desbloquear o forzar turnos en caso de emergencias u ausencias.

---

## 🏗 Arquitectura del Sistema

El proyecto sigue una arquitectura limpia basada en **Next.js App Router**, desacoplando la lógica de negocio en API Routes internas y servicios backend con persistencia en **PostgreSQL**.

```mermaid
flowchart TD
    subgraph Client ["💻 Cliente (Navegador)"]
        UI["React 19 Components / Tailwind CSS"]
        Views["Dashboard | Dishes | Cleaning | Reserves | Settings"]
    end

    subgraph Security ["🛡️ Capa de Seguridad"]
        MW["Next.js Middleware (middleware.ts)"]
        JWT["JWT Auth Cookie (HTTP-Only)"]
    end

    subgraph Backend ["⚡ Server App Router (app/api)"]
        AuthAPI["/api/auth/*"]
        SuppliesAPI["/api/supplies/*"]
        DishesAPI["/api/dishes/*"]
        CleaningAPI["/api/cleaning-groups/*"]
        RouletteAPI["/api/water-bottle/*"]
        ReservesAPI["/api/reserves/*"]
        AdminAPI["/api/admin/*"]
    end

    subgraph Data ["🗄️ Persistencia de Datos"]
        DB[(PostgreSQL - Vercel Postgres / Supabase)]
        Helpers["lib/db.ts & lib/auth.ts"]
    end

    UI --> MW
    MW -->|Validado| Views
    Views -->|Fetch API| AuthAPI & SuppliesAPI & DishesAPI & CleaningAPI & RouletteAPI & ReservesAPI & AdminAPI
    AuthAPI & SuppliesAPI & DishesAPI & CleaningAPI & RouletteAPI & ReservesAPI & AdminAPI --> Helpers
    Helpers --> DB
```

---

## 🛠️ Stack Tecnológico

| Capa                  | Tecnología                                                                                   | Versión           | Propósito                                                   |
| :-------------------- | :------------------------------------------------------------------------------------------- | :---------------- | :---------------------------------------------------------- |
| **Framework Base**    | [Next.js](https://nextjs.org/)                                                               | `16.1.3`          | App Router, Server Components y API Routes                  |
| **Biblioteca UI**     | [React](https://react.dev/)                                                                  | `19.2.3`          | Construcción de interfaces reactivas y modularizadas        |
| **Lenguaje**          | [TypeScript](https://www.typescriptlang.org/)                                                | `5.9.3`           | Tipado estático robusto y desarrollo seguro                 |
| **Estilos**           | [Tailwind CSS](https://tailwindcss.com/)                                                     | `3.4.17`          | Utility-first CSS framework para diseño responsive          |
| **Base de Datos**     | [PostgreSQL](https://www.postgresql.org/)                                                    | PG 8 / Vercel     | Base de datos relacional para persistencia de datos         |
| **Autenticación**     | [Jose JWT](https://github.com/panva/jose) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js) | `6.1.3` / `3.0.3` | Generación/verificación de JWT y hash seguro de contraseñas |
| **Pruebas Unitarias** | [Vitest](https://vitest.dev/)                                                                | `3.2.4`           | Test runner ultrarrápido para lógica de rotación y grupos   |
| **Despliegue**        | [Vercel](https://vercel.com/)                                                                | Cloud Platform    | Hosting serverless, CDN y base de datos gestionada          |

---

## 🗄️ Modelo de Datos (Base de Datos)

El esquema relacional definido en `schema.sql` administra la interacción entre usuarios, turnos e historial:

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────────┐
│    users     │──────<│     supplies     │──────<│    supply_history    │
├──────────────┤       ├──────────────────┤       ├──────────────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)              │
│ name         │       │ name             │       │ supply_id (FK)       │
│ email        │       │ supply_type      │       │ user_id (FK)         │
│ username     │       │ current_user_id  │       │ purchase_date        │
│ password_hash│       │ duration_days    │       │ actual_duration_days │
│ is_admin     │       │ rotation_order[] │       └──────────────────────┘
└──────────────┘       └──────────────────┘
       │                        │
       │                        │                 ┌──────────────────────┐
       ├────────────────────────┼────────────────<│     dish_records     │
       │                        │                 ├──────────────────────┤
       │                        │                 │ id (PK)              │
       │                        │                 │ user_id (FK)         │
       │                        │                 │ record_date          │
       │                        │                 │ action ('wash/dry')  │
       │                        │                 └──────────────────────┘
       │                        │
       │                        │                 ┌──────────────────────┐
       ├────────────────────────┼────────────────<│   cleaning_groups    │
       │                        │                 ├──────────────────────┤
       │                        │                 │ id (PK)              │
       │                        │                 │ week_start / week_end│
       │                        │                 │ user_ids[]           │
       │                        │                 └──────────────────────┘
       │                        │
       │                        │                 ┌──────────────────────┐
       └────────────────────────┴────────────────<│  water_bottle_roulette│
                                                  ├──────────────────────┤
                                                  │ id (PK)              │
                                                  │ cycle_number         │
                                                  │ user_id (FK)         │
                                                  └──────────────────────┘
```

---

## 🚀 Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto localmente en tu entorno de desarrollo:

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/departamento-piso3.git
cd departamento-piso3
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea el archivo `.env.local` basándote en el siguiente ejemplo:

```bash
cp .env.example .env.local
```

### 4. Inicializar la Base de Datos

Conéctate a tu instancia local o remota de PostgreSQL (Supabase / Vercel Postgres) y ejecuta el script de migración inicial:

```bash
psql $POSTGRES_URL -f schema.sql
```

> 💡 **Nota:** También puedes copiar y ejecutar el contenido de [schema.sql](schema.sql) directamente desde la consola SQL del dashboard de Vercel Storage o Supabase.

### 5. Generar Hash de Contraseñas

Las contraseñas de demostración en `schema.sql` usan valores de prueba. Genera un hash real para tus usuarios ejecutando:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('tu_contraseña_segura', 10));"
```

Actualiza la columna `password_hash` en la tabla `users` con el hash generado.

### 6. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

**Credenciales por Defecto (Entorno de Pruebas):**

- **Usuario:** `erick`
- **Contraseña:** `depto123` _(debe ser actualizada con un hash bcrypt válido)_

---

## 🔑 Variables de Entorno

| Variable              | Requerida | Descripción                                      | Ejemplo                                                      |
| :-------------------- | :-------: | :----------------------------------------------- | :----------------------------------------------------------- |
| `POSTGRES_URL`        |    Sí     | URI de conexión a PostgreSQL (Vercel / Supabase) | `postgres://user:pass@ep-xyz.postgres.database.azure.com/db` |
| `AUTH_SECRET`         |    Sí     | Secreto para firma y verificación de tokens JWT  | `openssl rand -base64 32`                                    |
| `NEXT_PUBLIC_APP_URL` |    No     | URL pública base de la aplicación                | `http://localhost:3000` / `https://depto-piso3.vercel.app`   |
| `CRON_SECRET`         |    No     | Token de autorización para tareas automatizadas  | `tu_secret_cron_123`                                         |

---

## 📡 Referencia de API Endpoints

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint            | Descripción                                       |   Acceso    |
| :----: | :------------------ | :------------------------------------------------ | :---------: |
| `POST` | `/api/auth/login`   | Autentica un usuario y establece cookie HTTP-Only |   Público   |
| `POST` | `/api/auth/logout`  | Revoca la sesión y elimina la cookie              | Autenticado |
| `GET`  | `/api/auth/session` | Obtiene el perfil de la sesión actual             | Autenticado |

### 🛒 Suministros (`/api/supplies`)

| Método  | Endpoint                 | Descripción                                         |   Acceso    |
| :-----: | :----------------------- | :-------------------------------------------------- | :---------: |
|  `GET`  | `/api/supplies`          | Obtiene el estado y turno actual de los suministros | Autenticado |
| `POST`  | `/api/supplies/complete` | Registra compra del suministro y avanza el turno    | Autenticado |
| `PATCH` | `/api/supplies/duration` | Actualiza la estimación de días del suministro      | Autenticado |

### 🍽️ Registro de Platos (`/api/dishes`)

|  Método  | Endpoint      | Descripción                                   |   Acceso    |
| :------: | :------------ | :-------------------------------------------- | :---------: |
|  `GET`   | `/api/dishes` | Lista registros de lavado/secado de la semana | Autenticado |
|  `POST`  | `/api/dishes` | Registra una tarea de platos realizada        | Autenticado |
| `DELETE` | `/api/dishes` | Elimina un registro de plato                  | Autenticado |

### 🧹 Grupos de Aseo (`/api/cleaning-groups` & `/api/cleaning-records`)

| Método | Endpoint                | Descripción                                          |   Acceso    |
| :----: | :---------------------- | :--------------------------------------------------- | :---------: |
| `GET`  | `/api/cleaning-groups`  | Obtiene el grupo de limpieza asignado para la semana | Autenticado |
| `POST` | `/api/cleaning-groups`  | Genera la rotación del grupo de la semana            | Autenticado |
| `POST` | `/api/cleaning-records` | Marca una tarea de área de aseo como completada      | Autenticado |

### 🎯 Ruleta & Reservas (`/api/water-bottle` & `/api/reserves`)

|       Método       | Endpoint            | Descripción                                           |   Acceso    |
| :----------------: | :------------------ | :---------------------------------------------------- | :---------: |
|   `GET` / `POST`   | `/api/water-bottle` | Consulta o registra el giro de la ruleta del botellón | Autenticado |
|   `GET` / `POST`   | `/api/reserves`     | Lista o crea ítems en el inventario personal          | Autenticado |
| `PATCH` / `DELETE` | `/api/reserves`     | Modifica el estado (`consumed`) o elimina un ítem     | Autenticado |

### ⚙️ Administración & Usuarios (`/api/admin` & `/api/users`)

| Método  | Endpoint                       | Descripción                                        |   Acceso    |
| :-----: | :----------------------------- | :------------------------------------------------- | :---------: |
| `POST`  | `/api/admin/unlock`            | Desbloquea o fuerza el avance de un turno atascado |  **Admin**  |
|  `GET`  | `/api/users`                   | Lista todos los roommates registrados              | Autenticado |
| `PATCH` | `/api/users/notification-days` | Actualiza preferencias de recordatorios            | Autenticado |

---

## 🧪 Pruebas y Scripts

El proyecto cuenta con suites de prueba unitarias implementadas en **Vitest** para garantizar el correcto funcionamiento de los algoritmos de rotación de aseo.

```bash
# Ejecutar servidor de desarrollo
npm run dev

# Ejecutar tests de unidad con Vitest
npm run test

# Verificar cumplimiento de reglas de Linting
npm run lint

# Compilar proyecto para producción
npm run build

# Iniciar servidor de producción
npm run start
```

---

## 🌐 Despliegue en Vercel

### 1. Importar el Repositorio

- Conecta tu cuenta de GitHub a [Vercel](https://vercel.com/).
- Selecciona el repositorio `departamento-piso3`. Vercel detectará la configuración de **Next.js** de forma automática.

### 2. Configurar Vercel Postgres / Supabase

- En la pestaña **Storage** de Vercel, crea una base de datos **Postgres**.
- Vincula la base de datos a tu proyecto para inyectar automáticamente `POSTGRES_URL`.
- En la consola de consultas (Query Console), ejecuta el archivo `schema.sql`.

### 3. Establecer Variables de Entorno

En **Settings > Environment Variables**, agrega:

- `AUTH_SECRET`: Generado previamente con OpenSSL.
- `NEXT_PUBLIC_APP_URL`: Dominio asignado en Vercel (ejemplo: `https://tu-app.vercel.app`).

---

## 🔧 Mantenimiento y Consultas SQL

### Reordenar Secuencia de Rotación de un Suministro

Para cambiar el orden de los turnos de un suministro en particular (ej. ID `1`):

```sql
UPDATE supplies
SET rotation_order = ARRAY[2, 4, 1, 3, 5],
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
```

### Agregar un Nuevo Roommate

```sql
-- 1. Insertar el nuevo usuario con password hasheado
INSERT INTO users (name, email, username, password_hash, is_admin)
VALUES ('Nuevo Roommate', 'roommate@depto3.com', 'nuevo_roommate', '$2a$10$hash_generado', false);

-- 2. Incluir el ID del nuevo usuario en la rotación de suministros
UPDATE supplies
SET rotation_order = array_append(rotation_order, 6);
```

### Otorgar Permisos de Administrador

```sql
UPDATE users SET is_admin = TRUE WHERE username = 'erick';
```

---

## 👥 Autores y Licencia

#### Autor: Erick Alpusig | erickdevlml@gmail.com

Desarrollado con ❤️ para organizar la convivencia diaria de los roommates del **Departamento Piso 3**.

Privado para uso interno. Reservados todos los derechos.
