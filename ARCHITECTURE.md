# Arquitectura Frontend

## Capas principales

- **features/**: verticales funcionales. Cada feature agrupa pages, components, services, hooks, types.
- **shared/**: piezas reutilizables transversales (componentes, contextos, hooks, estilos, utils).
- **core/**: infraestructura (api client, config, constants). Actualmente placeholders listos para crecer.
- **layouts/**: contenedores de layout como AppLayout (sidebar + header + búsqueda global).
- **hooks/AuthContext.js**: sesión y JWT; refresco vía axios interceptors en `features/usuarios/services/usuariosService.js`.
- **routes/routes.js**: enrutado principal; usa `ProtectedRoute` desde `shared/components` y páginas en `features`.

## Flujo de autenticación

1. `AuthContext` maneja login/registro usando `usuariosService` (login por email + password).
2. Tokens se guardan en `localStorage`.
   - Interceptor axios añade `Authorization: Bearer <access>` y, ante `401`, renueva con `/api/token/refresh/`.
   - Refresco proactivo: cada 60s se revisa el `exp` del access y, si faltan < 5 min, se pide un nuevo access en segundo plano.
3. `ProtectedRoute` protege rutas; redirige a `/login` si no hay sesión o si falla la renovación.

### Pasos: Refresh proactivo (cómo replicarlo)

- Backend: en `edu/edu/urls.py` añade `path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh')`.
- Frontend (servicio): en `features/usuarios/services/usuariosService.js` usa `${API_URL}/token/refresh/` en el interceptor y crea `refrescarAccess()`.
- Frontend (contexto): en `hooks/AuthContext.js` decodifica `exp` del access y cada 60s renueva si faltan < 5 min; limpia el intervalo en `logout()`.
- Resultado: el usuario mantiene sesión sin cortes hasta que caduque el refresh (7 días por defecto).

## Búsqueda global

- `SearchContext` (shared/context) almacena `searchTerm`.
- `AppLayout` muestra barra de búsqueda solo en `/usuarios` y actualiza el contexto.
- `UsuariosPage` consume `searchTerm` para filtrar `DataGrid` en cliente.

## Rutas principales

- `/login`, `/registro`: `features/auth/pages`.
- `/dashboard`: `features/usuarios/pages/DashboardPage`.
- `/perfil`: `features/auth/pages/PerfilPage` (datos propios).
- `/usuarios`: `features/usuarios/pages/UsuariosPage` (solo admin/super_admin; tabla con asignación académica y CRUD).

## Convenciones

- Servicios HTTP por feature en `features/<feature>/services/*Service.js` usando el cliente axios con interceptores.
- Componentes compartidos en `shared/components`; evita duplicar lógica de guardas o UI base.
- Contextos globales en `shared/context`.
- Mantener imports absolutos cortos relativos a `src/` (ej.: `features/usuarios/pages/...`).

## Próximos pasos recomendados

- Completar `core/api` con un cliente axios centralizado y reutilizarlo en servicios.
- Añadir `core/constants` para rutas y roles.
- Incorporar linters/formatters en CI (eslint/prettier) y scripts npm.
