# Sistema de Gestión Educativa - Frontend (React)

Aplicación web moderna desarrollada con React 19 y Material UI 7 para la gestión integral de procesos educativos. Incluye autenticación JWT, gestión de usuarios, módulo académico y dashboard interactivo.

## 🚀 Características

### Autenticación y Seguridad

- ✅ Login con email y contraseña
- ✅ Registro de nuevos usuarios con validación
- ✅ Autenticación JWT con renovación automática de tokens
- ✅ Refresh proactivo de tokens (cuando quedan <5 minutos)
- ✅ Rutas protegidas por rol (Administrador, Docente, Estudiante)
- ✅ Sesión persistente con localStorage
- ✅ Cierre de sesión automático al expirar refresh token

### Gestión de Usuarios

- Dashboard con estadísticas
- Listado de usuarios con filtros y búsqueda
- Tabla interactiva con DataGrid de MUI
- Edición y eliminación (solo Administradores)
- Visualización de perfiles con avatar
- Cambio de contraseña seguro

### Módulo Académico

- Gestión de instituciones educativas
- Administración de sedes
- Configuración de grados académicos
- Catálogo de asignaturas
- Asignaciones docente-asignatura
- Asignaciones estudiante-grado

### UX/UI

- Diseño responsive con Material UI
- Tema personalizable (light/dark)
- Navegación con drawer lateral
- Mensajes de feedback (Snackbar)
- Loader global durante peticiones
- Manejo de errores centralizado

## 📋 Requisitos

- Node.js 18+
- npm 9+ o yarn 1.22+
- Backend Django corriendo en `http://localhost:8000`

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Crhistian-LAMBDA/Edu_React.git
cd Edu_React
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno (opcional)

Crear archivo `.env` en la raíz:

```env
REACT_APP_API_URL=http://localhost:8000
```

Si no se configura, usa `http://localhost:8000` por defecto.

### 4. Iniciar servidor de desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📦 Scripts Disponibles

| Comando         | Descripción                                               |
| --------------- | --------------------------------------------------------- |
| `npm start`     | Inicia el servidor de desarrollo en http://localhost:3000 |
| `npm test`      | Ejecuta los tests en modo interactivo                     |
| `npm run build` | Genera build de producción en carpeta `/build`            |
| `npm run eject` | Expone configuración de webpack (irreversible)            |

## 🗂️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   └── Common/         # Componentes comunes (Header, Sidebar, etc)
├── core/               # Configuración base
│   ├── api/           # Cliente Axios configurado
│   ├── config/        # Constantes y configuraciones
│   └── constants/     # Variables globales
├── features/          # Módulos por funcionalidad
│   ├── auth/         # Autenticación
│   │   ├── pages/    # Login, Registro, Perfil
│   │   └── services/ # authService.js
│   ├── usuarios/     # Gestión de usuarios
│   │   ├── pages/    # UsuariosPage, Dashboard
│   │   └── services/ # usuariosService.js
│   └── academico/    # Módulo académico
│       ├── pages/
│       └── services/
├── hooks/             # Custom hooks
│   └── AuthContext.js # Contexto de autenticación
├── layouts/           # Layouts de la app
│   └── AppLayout.js   # Layout principal con sidebar
├── routes/            # Configuración de rutas
│   └── routes.js      # Rutas protegidas y públicas
├── shared/            # Código compartido
│   ├── components/
│   │   └── ProtectedRoute.js
│   ├── context/
│   │   └── SearchContext.js
│   └── utils/
├── App.js             # Componente raíz
├── index.js           # Punto de entrada
└── theme.js           # Tema Material UI
```

## 🔐 Autenticación JWT

### Flujo de Login

1. Usuario ingresa email y contraseña
2. Backend valida credenciales y devuelve tokens:
   - `access`: válido 1 hora
   - `refresh`: válido 7 días
3. Frontend guarda tokens en localStorage
4. Cada petición incluye `Authorization: Bearer <access>`

### Renovación de Tokens

- **Automática en 401:** Si una petición devuelve 401, el interceptor intenta renovar con `/api/token/refresh/`
- **Proactiva:** Cada 60 segundos verifica si el access token expira en <5 minutos y lo renueva preventivamente

### Implementación

`src/hooks/AuthContext.js`:

```javascript
// Decodifica exp del token y programa refresh proactivo
useEffect(() => {
  const interval = setInterval(() => {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;
    if (decoded.exp - now < 300) {
      // <5 min
      refrescarAccess();
    }
  }, 60000); // cada 60s
  return () => clearInterval(interval);
}, [token]);
```

## 📚 Servicios Principales

### `usuariosService.js`

```javascript
// Login con email
login(email, password);

// Registro
registro(datos);

// Obtener usuario autenticado
obtenerUsuarioActual();

// Cambiar contraseña
cambiarPassword(passwordActual, passwordNueva);

// Renovar token de acceso
refrescarAccess();
```

### Interceptor Axios

Configurado en `core/api/`:

- Añade `Authorization: Bearer <token>` a todas las peticiones
- Intercepta 401 y renueva token automáticamente
- Reintentar petición original tras refresh exitoso

## 🎨 Temas y Estilos

Material UI con tema personalizado (`theme.js`):

```javascript
const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});
```

## 📖 Páginas Principales

| Ruta         | Componente    | Descripción          | Acceso        |
| ------------ | ------------- | -------------------- | ------------- |
| `/login`     | LoginPage     | Inicio de sesión     | Público       |
| `/registro`  | RegistroPage  | Registro de usuarios | Público       |
| `/dashboard` | DashboardPage | Panel principal      | Autenticado   |
| `/perfil`    | PerfilPage    | Perfil del usuario   | Autenticado   |
| `/usuarios`  | UsuariosPage  | Gestión de usuarios  | Admin/Docente |

## 🛡️ Rutas Protegidas

Componente `ProtectedRoute.js`:

```javascript
<ProtectedRoute allowedRoles={["Administrador"]}>
  <UsuariosPage />
</ProtectedRoute>
```

## 🔄 Contextos Globales

### AuthContext

- Maneja estado de autenticación
- Login/logout
- Renovación de tokens
- Información del usuario actual

### SearchContext

- Búsqueda global en DataGrid
- Filtros persistentes

## 🛠️ Tecnologías Utilizadas

- **React 19** - Biblioteca UI
- **Material UI 7** - Componentes UI
- **Axios** - Cliente HTTP
- **React Router 6** - Enrutamiento
- **jwt-decode** - Decodificación de JWT
- **Create React App** - Scaffolding

## 🚀 Despliegue

### Build de Producción

```bash
npm run build
```

Genera carpeta `/build` optimizada para producción.

### Servir Build Estático

```bash
# Con servidor simple
npx serve -s build

# O con nginx/apache
# Copiar contenido de /build a carpeta web
```

### Variables de Entorno para Producción

Crear `.env.production`:

```env
REACT_APP_API_URL=https://api.tudominio.com
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Cobertura
npm test -- --coverage
```

## 📝 Notas de Desarrollo

- El token de acceso se guarda en `localStorage` como `token`
- El token de refresh se guarda en `localStorage` como `refreshToken`
- Al cerrar sesión, se limpian ambos tokens
- Las credenciales NO se almacenan, solo los tokens JWT
- El backend debe tener CORS habilitado para `http://localhost:3000`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de uso educativo.

## 👤 Autor

**Christian LAMBDA**

- GitHub: [@Crhistian-LAMBDA](https://github.com/Crhistian-LAMBDA)

---

**Backend relacionado:** [Edu_Djando](https://github.com/Crhistian-LAMBDA/Edu_Djando)
