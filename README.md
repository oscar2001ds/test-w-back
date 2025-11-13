# 🏦 Test W - Sistema de Simulaciones Financieras

Sistema backend desarrollado para **Banco W** que permite gestionar usuarios y simular productos financieros con cálculos de inversión, autenticación JWT y autorización basada en roles.

## 📋 Tabla de Contenido

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Sistema de Roles](#sistema-de-roles)
- [Base de Datos](#base-de-datos)
- [Arquitectura](#arquitectura)

## ✨ Características

### 🔐 **Sistema de Autenticación**
- Login con JWT y refresh tokens
- Autenticación mediante cookies HTTP-only
- Protección contra ataques XSS y CSRF
- Logout con invalidación de tokens

### 👥 **Gestión de Usuarios**
- CRUD completo de usuarios
- Sistema de roles jerárquico (Super Admin, Admin, Supervisor, Cliente)
- Autorización granular basada en roles
- Estadísticas de usuarios por rol

### 💰 **Simulaciones Financieras**
- Creación y gestión de simulaciones de inversión
- Cálculo automático de valores futuros
- Múltiples métodos de pago (mensual, anual)
- Validación de rangos de fechas y montos
- Estadísticas agregadas por usuario
- Estados de simulación (activa, completada, pausada)

### 📊 **Reportes y Estadísticas**
- Estadísticas de usuarios por rol
- Métricas de simulaciones por usuario
- Cálculos de retorno de inversión
- Dashboard con datos agregados

## 🛠 Tecnologías

- **Framework**: NestJS 11
- **Lenguaje**: TypeScript
- **Base de Datos**: MySQL con Sequelize ORM
- **Autenticación**: JWT + Passport.js
- **Validación**: Class Validator + Class Transformer
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **MySQL** >= 8.0.0
- **Git**

## 🚀 Instalación

### 1. **Clonar el repositorio**
```bash
git clone https://github.com/oscar2001ds/test-w-back.git
cd test-w-back
```

### 2. **Instalar dependencias**
```bash
npm install
```

### 3. **Crear base de datos MySQL**
Conecta a tu servidor MySQL y crea la base de datos:
```sql
CREATE DATABASE `test-w` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## ⚙️ Configuración

### 1. **Variables de Entorno**
Copia el archivo de ejemplo y configura las variables:
```bash
cp .env.example .env
```

### 2. **Editar archivo .env**
Modifica las siguientes variables según tu entorno:

```bash
# ===========================================
# APPLICATION CONFIGURATION
# ===========================================
NODE_ENV=development
SERVER_PORT=4000
ROOT_DOMAIN=localhost:4000

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_DATABASE_NAME=test-w

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET=tu-clave-secreta-jwt-muy-segura
JWT_REFRESH_SECRET=tu-clave-secreta-refresh-muy-segura
```

> **⚠️ Importante**: Cambia los valores de `JWT_SECRET` y `JWT_REFRESH_SECRET` por claves seguras en producción.

## 🚀 Ejecución

### **Desarrollo (con datos de prueba)**
```bash
# Inicializar base de datos con datos semilla
npm run initDB

# Iniciar servidor en modo desarrollo
npm run start:dev
```

### **Solo sincronización de base de datos**
```bash
# Sincronizar estructura de tablas (sin datos)
npm run sync

# Poblar con datos semilla
npm run populate
```

### **Resetear base de datos completamente**
```bash
# Eliminar y recrear base de datos con datos semilla
npm run restartDB
```

### **Producción**
```bash
# Compilar proyecto
npm run build

# Ejecutar en producción
npm run start:prod
```

La aplicación estará disponible en: `http://localhost:4000`

Documentación Swagger: `http://localhost:4000/api`

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Ejecuta en modo desarrollo con auto-recarga |
| `npm run start:prod` | Ejecuta en modo producción |
| `npm run build` | Compila el proyecto |
| `npm run test` | Ejecuta tests unitarios |
| `npm run test:e2e` | Ejecuta tests end-to-end |
| `npm run lint` | Ejecuta linter y corrige errores |
| `npm run format` | Formatea código con Prettier |
| `npm run sync` | Sincroniza estructura de base de datos |
| `npm run populate` | Inserta datos semilla |
| `npm run initDB` | Sincroniza DB e inserta datos semilla |
| `npm run restartDB` | Recrea DB completamente con datos |

## 📁 Estructura del Proyecto

```
src/
├── auth/                     # Módulo de autenticación
│   ├── dto/                  # DTOs para login/register
│   ├── guards/               # Guards JWT y Local
│   ├── strategies/           # Estrategias Passport (JWT, Local)
│   └── interfaces/           # Interfaces de JWT payload
├── common/                   # Código compartido
│   ├── decorators/           # Decoradores personalizados (@Public, @GetUser)
│   ├── enums/                # Enums (UserRole, etc.)
│   └── filters/              # Filtros de excepción
├── config/                   # Configuraciones
│   ├── database.config.ts    # Configuración Sequelize
│   ├── jwt.config.ts         # Configuración JWT
│   └── cors.config.ts        # Configuración CORS
├── database/                 # Base de datos
│   ├── database.module.ts    # Módulo de conexión DB
│   ├── database.service.ts   # Servicio de gestión DB
│   └── seeds/                # Datos semilla
├── scripts/                  # Scripts de utilidad
│   ├── sync.ts              # Sincronización de DB
│   ├── populate.ts          # Población de datos
│   └── sync-populate.ts     # Sync + populate combinado
├── simulations/             # Módulo de simulaciones
│   ├── dto/                 # DTOs de simulaciones
│   ├── entities/            # Entidades Sequelize
│   ├── repositories/        # Patrón Repository
│   ├── services/            # Lógica de negocio
│   │   ├── simulation.service.ts          # CRUD simulaciones
│   │   └── simulation-calculator.service.ts # Cálculos financieros
│   ├── interfaces/          # Interfaces TypeScript
│   └── decorators/          # Decoradores de inyección
├── users/                   # Módulo de usuarios
│   ├── dto/                 # DTOs de usuarios
│   ├── entities/            # Entidad User
│   ├── services/            # Servicios de usuarios
│   │   └── authorization.service.ts # Lógica de autorización
│   ├── interfaces/          # Interfaces de respuesta
│   └── users.repository.ts  # Repository de usuarios
└── main.ts                  # Punto de entrada de la aplicación
```

## 🌐 API Endpoints

### **Autenticación**
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `POST /auth/refresh` - Renovar token

### **Usuarios**
- `GET /users` - Listar usuarios (público)
- `POST /users` - Crear usuario (requiere permisos)
- `GET /users/:id` - Obtener usuario por ID
- `PATCH /users/:id` - Actualizar usuario
- `PATCH /users/:id/role` - Cambiar rol de usuario
- `GET /users/role-with-stats` - Usuarios por rol con estadísticas
- `DELETE /users/:id` - Eliminar usuario

### **Simulaciones**
- `POST /simulations/user/:userId` - Crear simulación
- `GET /simulations/user/:userId` - Listar simulaciones de usuario
- `GET /simulations/stats/:userId` - Estadísticas de usuario
- `PATCH /simulations/:id/user/:userId` - Actualizar simulación
- `DELETE /simulations/:id/user/:userId` - Eliminar simulación

## 👤 Sistema de Roles

### **Jerarquía de Roles**
1. **Super Admin** (Nivel 4) - Acceso total
2. **Admin** (Nivel 3) - Gestión de supervisores y clientes
3. **Supervisor** (Nivel 2) - Gestión de clientes
4. **Cliente** (Nivel 1) - Solo sus propios datos

### **Permisos por Rol**

| Acción | Super Admin | Admin | Supervisor | Cliente |
|--------|:-----------:|:-----:|:----------:|:-------:|
| Crear usuarios | ✅ Todos | ✅ Sup./Client. | ✅ Solo Client. | ❌ |
| Ver usuarios | ✅ Todos | ✅ Inf. jerarquía | ✅ Inf. jerarquía | ✅ Solo propio |
| Cambiar roles | ✅ Todos | ✅ Sup./Client. | ✅ Solo Client. | ❌ |
| Ver simulaciones | ✅ Todas | ✅ Inf. jerarquía | ✅ Inf. jerarquía | ✅ Solo propias |
| Gestionar simul. | ✅ Todas | ✅ Inf. jerarquía | ✅ Inf. jerarquía | ✅ Solo propias |

## 🗄️ Base de Datos

### **Tablas Principales**

#### **users**
- Gestión de usuarios del sistema
- Roles jerárquicos con validación
- Soft delete y timestamps automáticos
- Autenticación con bcrypt

#### **simulations**
- Simulaciones de productos financieros
- Cálculos automáticos de retorno
- Estados y validaciones de fechas
- Relación FK con users

### **Datos Semilla**
El sistema incluye datos de prueba:
- **21 usuarios** con distribución realista de roles
- **85+ simulaciones** con escenarios variados
- Datos apropiados para testing y desarrollo

## 🏗️ Arquitectura

### **Patrones Implementados**
- **Repository Pattern**: Abstracción de acceso a datos
- **Service Layer**: Lógica de negocio centralizada
- **DTO Pattern**: Validación y transformación de datos
- **Guard Pattern**: Control de acceso y autenticación
- **Decorator Pattern**: Funcionalidades transversales

### **Principios SOLID**
- **Single Responsibility**: Cada clase tiene una responsabilidad específica
- **Open/Closed**: Extensible mediante interfaces
- **Liskov Substitution**: Interfaces bien definidas
- **Interface Segregation**: Interfaces pequeñas y específicas
- **Dependency Inversion**: Inyección de dependencias

### **Características Técnicas**
- **Validación robusta**: Class-validator en DTOs
- **Manejo de errores**: Filtros de excepción centralizados
- **Logging**: Sistema de logs estructurado
- **Seguridad**: JWT, CORS, validación de entrada
- **Documentación**: Swagger auto-generado

---

## 📄 Licencia

Este proyecto es privado y confidencial para **Banco W**.

## 👨‍💻 Desarrollador

**Oscar David Díaz Santos**  
Desarrollado para la prueba técnica de Banco W