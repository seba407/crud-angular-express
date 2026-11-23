# CRUD de Productos — Angular + Express

Aplicación full-stack para administrar un inventario de productos: inicio de sesión con JWT y CRUD completo (listar, crear, editar y eliminar) desde una sola pantalla.

- **Frontend:** Angular 20 (standalone components, signals, Reactive Forms tipados)
- **Backend:** API REST con Express 5, autenticación JWT y documentación Swagger/OpenAPI

## Funcionalidades

- **Login** con JWT. Las rutas están protegidas con guards y, si el token expira, la sesión se cierra sola.
- **Listado de productos** con búsqueda por texto, filtro por categoría y tarjetas de resumen (total, unidades, valor del inventario y productos sin stock).
- **Crear y editar** en un mismo modal, con validaciones en el formulario y en el servidor.
- **Eliminar** con diálogo de confirmación.
- **Modo claro / oscuro** con selector en el navbar; la preferencia se guarda.
- Notificaciones de éxito y error, estados de carga y diseño responsive.
- **API documentada** con Swagger UI y cubierta con tests de integración.

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | Angular 20, TypeScript, RxJS, SCSS, Karma + Jasmine |
| Backend | Node.js, Express 5, jsonwebtoken, swagger-ui-express, `node:test` |

## Estructura

```
.
├── frontend/          # Aplicación Angular
│   └── src/app/
│       ├── core/      # Servicios, auth (guard + interceptor), modelos, tema
│       ├── pages/     # Login y página de productos
│       └── components/# Modal de formulario y diálogo de confirmación
└── backend/           # API Express
    ├── src/
    │   ├── auth/      # Login JWT y middleware de autenticación
    │   ├── products/  # Rutas, validación y repositorio de productos
    │   ├── docs/      # Especificación OpenAPI
    │   └── middleware/# Manejo de errores
    └── test/          # Tests de integración de la API
```

## Cómo ejecutarlo

Requisitos: **Node.js 20.6 o superior**.

```bash
# 1. Backend (http://localhost:3000/api)
cd backend
npm install
npm run dev

# 2. Frontend, en otra terminal (http://localhost:4200)
cd frontend
npm install
npm start
```

Abre http://localhost:4200 e inicia sesión con:

| Usuario | Contraseña |
|---|---|
| `admin` | `admin` |

En desarrollo, `ng serve` redirige las peticiones a `/api` hacia el backend (ver `frontend/proxy.conf.json`), así que no hace falta configurar CORS ni URLs.

### Configuración del backend

Todas las variables son opcionales y tienen valores por defecto. Para cambiarlas, copia `backend/.env.example` a `backend/.env`.

| Variable | Por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto de la API |
| `CORS_ORIGIN` | `http://localhost:4200` | Origen permitido por CORS |
| `ADMIN_USER` / `ADMIN_PASSWORD` | `admin` / `admin` | Credenciales de acceso |
| `JWT_SECRET` | secreto de desarrollo | **Definirlo en producción** |
| `JWT_EXPIRES_IN` | `8h` | Duración del token |
| `DATA_FILE` | `data/products.json` | Archivo donde se guardan los productos |

## API

Documentación interactiva en **http://localhost:3000/api/docs** (Swagger UI). Para probar los endpoints protegidos, ejecuta `POST /auth/login` y pega el token en **Authorize**.

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Inicia sesión y devuelve `{ token, user }` | — |
| `GET` | `/api/auth/me` | Usuario autenticado | ✔ |
| `GET` | `/api/products` | Lista los productos | ✔ |
| `GET` | `/api/products/:id` | Obtiene un producto | ✔ |
| `POST` | `/api/products` | Crea un producto | ✔ |
| `PUT` | `/api/products/:id` | Edita un producto | ✔ |
| `DELETE` | `/api/products/:id` | Elimina un producto | ✔ |
| `GET` | `/api/health` | Estado del servicio | — |

Los errores siempre tienen la forma `{ message, errors? }`. En las validaciones (400), `errors` trae el detalle por campo.

## Tests

```bash
cd backend && npm test     # tests de integración de la API
cd frontend && npm test    # tests del frontend (Karma)
```

## Decisiones de diseño

- **Capa de datos intercambiable:** el backend guarda los productos en un archivo JSON a través de un repositorio. Para migrar a una base de datos basta con implementar otro repositorio con los mismos métodos, sin tocar las rutas.
- **Errores centralizados:** en el backend, las rutas lanzan `HttpError` y un único middleware arma la respuesta. En el frontend, un interceptor HTTP agrega el token, convierte los errores al mensaje del servidor y cierra la sesión ante un 401.
- **Estado con signals:** el frontend usa `signal` y `computed` para el estado de la página (filtros, modal, notificaciones) sin librerías externas de estado.
