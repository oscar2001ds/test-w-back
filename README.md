# 🏦 Test Banco W - Sistema de Simulaciones Financieras

Sistema backend desarrollado para **Banco W** que permite gestionar usuarios y simular productos financieros con cálculos de inversión, autenticación JWT y autorización basada en roles.

## 🚀 Características Principales

### 🔐 **Sistema de Autenticación**
- Login con JWT y refresh tokens
- Autenticación mediante cookies HTTP-only

### 👥 **Gestión de Usuarios**
- CRUD completo de usuarios
- Sistema de roles jerárquico (Super Admin, Admin, Supervisor, Cliente)
- Autorización granular basada en roles
- Estadísticas de usuarios por rol

### 💰 **Simulaciones Financieras**
- Creación y gestión de simulaciones de inversión
- Cálculo automático de tasa de interés
- Manejo de estados de simulación (activa, completada, pausada)

### 📊 **Reportes y Estadísticas**
- Estadísticas de usuarios por rol
- Métricas de simulaciones por usuario
- Cálculos de retorno de inversión
- Dashboard con datos agregados

## 🛠 Tecnologías

- **Framework**: NestJS 11
- **Lenguaje**: TypeScript
- **Base de Datos**: MySQL con Sequelize ORM
- **Autenticación**: JWT
- **Validación**: Class Validator
- **Documentación**: Swagger/OpenAPI

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **MySQL** >= 8.0.0
- **Git**

## 🚀 Instalación y Ejecución

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
Si usas una herramienta como DBeaver, TablePlus o MySQL Workbench,
puedes crear una base de datos llamada '***test-w***' directamente desde la interfaz.

En caso contrario, conéctate a tu servidor MySQL y ejecútalo manualmente con el siguiente comando:
```sql
CREATE DATABASE `test-w` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. **Variables de Entorno**
Copia el archivo de ejemplo y configura las variables:
```bash
cp .env.example .env
```

### 5. **Editar archivo .env**
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

### 6. **Desarrollo (con datos de prueba)**
```bash
# Este comando inicializa base de datos y carga las tablas con datos semilla
npm run initDB

# Iniciar servidor en modo desarrollo
npm run start:dev
```
La aplicación estará disponible en: `http://localhost:4000`

Documentación Swagger: `http://localhost:4000/api`

## ➕ Comandos Extra

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
- `POST /users` - Crear usuario
- `GET /users/role-with-stats` - Obtener usuarios por rol con estadísticas.
- `GET /users/overview-stats` - Obtener estadísticas generales de usuarios
- `PATCH /users/:id` - Actualizar usuario
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
| Ver usuarios | ✅ Todos | ✅ jerarquía Inferior | ✅ jerarquía Inferior | ✅ Solo propio |
| Cambiar roles | ✅ Todos | ✅ Sup./Client. | ✅ Solo Client. | ❌ |
| Ver simulaciones | ✅ Todas | ✅ jerarquía Inferior | ✅ jerarquía Inferior | ✅ Solo propias |
| Gestionar simul. | ✅ Todas | ✅ jerarquía Inferior | ✅ jerarquía Inferior | ✅ Solo propias |

## � Sistema de Tasas de Interés

### **📈 Tasas Base por Plazo**

El sistema implementa una tabla de tasas progresiva según el plazo de inversión:

| **Plazo** | **Tasa Anual** | **Descripción** |
|-----------|:--------------:|-----------------|
| 1-6 meses | **8.0%** | Inversiones a corto plazo |
| 7-12 meses | **9.5%** | Inversiones a mediano plazo |
| 13-24 meses | **11.0%** | Inversiones a largo plazo |
| 25-36 meses | **12.5%** | Inversiones extendidas |
| 37-60 meses | **14.0%** | Inversiones a 5 años |
| 61-120 meses | **15.5%** | Inversiones a 10 años |
| 121+ meses | **17.0%** | Inversiones a muy largo plazo |

### **🎁 Sistema de Bonificaciones**

Se aplican bonos adicionales automáticamente según el monto invertido:

| **Monto de Inversión** | **Bonificación** | **Ejemplo** |
|------------------------|:----------------:|-------------|
| **$100M+** | **+0.5%** | 14.0% → 14.5% |
| **$50M - $99M** | **+0.3%** | 14.0% → 14.3% |
| **$10M - $49M** | **+0.1%** | 14.0% → 14.1% |
| **Menos de $10M** | **Sin bono** | Tasa base |

### **⚡ Bonificación por Método de Pago**

- **Pago Anual**: **+0.5%** adicional
- **Pago Mensual**: Tasa base (sin penalización)

### **⚠️ Sistema de Penalizaciones**

| **Condición** | **Penalización** | **Motivo** |
|---------------|:----------------:|------------|
| **Plazo < 6 meses** | **-1.0%** | Inversión muy corta |

### **🧮 Ejemplo de Cálculo**

**Simulación:** $75,000,000 COP por 36 meses con pago anual

1. **Tasa base** (25-36 meses): `12.5%`
2. **Bonificación por monto** ($50M+): `+0.3%`
3. **Bonificación pago anual**: `+0.5%`
4. **Tasa final**: `12.5% + 0.3% + 0.5% = 13.3%`

### **🔒 Validaciones del Sistema**

- **Tasa mínima**: 5% (protección al cliente)
- **Tasa máxima**: 25% (límite regulatorio)
- **Plazo mínimo**: 1 mes
- **Plazo máximo**: 50 años (600 meses)
- **Fecha inicio**: No puede ser anterior a hoy

## �🗄️ Base de Datos

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

## 🎉 Conclusión

Gracias por tomarse el tiempo de revisar mi prueba. La desarrollé con mucho esfuerzo y dedicación, buscando entregar un resultado que realmente valiera la pena.  
Si tienen alguna inquietud o comentario, pueden contactarme al número de abajo. Un Saludo, espero podernos ver pronto!
- 🟢 WhatsApp: 3124204039 

---

**Desarrollado con ❤️**