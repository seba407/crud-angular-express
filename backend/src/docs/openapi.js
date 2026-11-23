import { PRODUCT_CATEGORIES } from '../products/product.model.js';

const errorResponse = (description, example) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example } },
});

const responses = {
  Unauthorized: errorResponse('Token ausente, inválido o expirado', { message: 'No autenticado' }),
  NotFound: errorResponse('El producto no existe', { message: 'Producto 99 no encontrado' }),
  InvalidId: errorResponse('Id inválido', { message: 'Id inválido' }),
  ValidationError: errorResponse('Datos inválidos', {
    message: 'Datos inválidos',
    errors: { name: 'El nombre es obligatorio', price: 'Debe ser un número mayor o igual a 0' },
  }),
};

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Id del producto',
  schema: { type: 'integer', minimum: 1 },
  example: 1,
};

/**
 * Especificación OpenAPI 3 de la API. Se sirve en /api/docs (Swagger UI)
 * y en /api/docs.json. Mantenerla al día al cambiar rutas o validaciones.
 */
export function buildOpenApiSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'CRUD Productos API',
      version: '1.0.0',
      description:
        'API REST del CRUD de productos.\n\n' +
        '**Cómo probar:** ejecuta `POST /auth/login` con `admin` / `admin`, copia el `token` ' +
        'y pégalo en el botón **Authorize**.',
    },
    servers: [{ url: '/api' }],
    tags: [
      { name: 'Auth', description: 'Inicio de sesión y usuario actual' },
      { name: 'Products', description: 'CRUD de productos (requiere token)' },
      { name: 'Health', description: 'Estado del servicio' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Estado del servicio',
          responses: {
            200: {
              description: 'El servicio está operativo',
              content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          description: 'Devuelve un JWT para usar en `Authorization: Bearer <token>`.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: {
              description: 'Login correcto',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
            },
            400: errorResponse('Faltan usuario o contraseña', { message: 'Usuario y contraseña son obligatorios' }),
            401: errorResponse('Credenciales incorrectas', { message: 'Usuario o contraseña incorrectos' }),
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Usuario del token', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'Listar productos',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de productos',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
        post: {
          tags: ['Products'],
          summary: 'Crear producto',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } } },
          },
          responses: {
            201: {
              description: 'Producto creado (header `Location` con su URL)',
              headers: { Location: { schema: { type: 'string', example: '/api/products/7' } } },
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/products/{id}': {
        parameters: [idParam],
        get: {
          tags: ['Products'],
          summary: 'Obtener producto',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Producto', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            400: { $ref: '#/components/responses/InvalidId' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        put: {
          tags: ['Products'],
          summary: 'Editar producto',
          description: 'Reemplaza todos los campos editables. `id` y `createdAt` se conservan.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } } },
          },
          responses: {
            200: { description: 'Producto actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Products'],
          summary: 'Eliminar producto',
          security: [{ bearerAuth: [] }],
          responses: {
            204: { description: 'Producto eliminado (sin contenido)' },
            400: { $ref: '#/components/responses/InvalidId' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      responses,
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', format: 'password', example: 'admin' },
          },
        },
        User: {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'admin' },
            name: { type: 'string', example: 'Administrador' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        ProductInput: {
          type: 'object',
          required: ['name', 'category', 'price', 'stock'],
          properties: {
            name: { type: 'string', maxLength: 80, description: 'Se recortan espacios; no puede quedar vacío', example: 'Teclado mecánico' },
            description: { type: 'string', maxLength: 200, default: '', example: 'Switches rojos, layout español' },
            category: { type: 'string', enum: PRODUCT_CATEGORIES, example: PRODUCT_CATEGORIES[0] },
            price: { type: 'number', minimum: 0, example: 49990 },
            stock: { type: 'integer', minimum: 0, example: 10 },
          },
        },
        Product: {
          allOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 7 },
              },
            },
            { $ref: '#/components/schemas/ProductInput' },
            {
              type: 'object',
              properties: {
                createdAt: { type: 'string', format: 'date-time', example: '2026-11-23T23:20:44.020Z' },
              },
            },
          ],
        },
        Error: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string' },
            errors: {
              type: 'object',
              description: 'Solo en errores de validación: mensaje por campo',
              additionalProperties: { type: 'string' },
            },
          },
        },
      },
    },
  };
}
