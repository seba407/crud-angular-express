import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiSpec } from './docs/openapi.js';
import { authRouter } from './auth/auth.routes.js';
import { requireAuth } from './auth/auth.middleware.js';
import { productsRouter } from './products/products.routes.js';
import { errorHandler, notFound } from './middleware/errors.js';

/**
 * Construye la app sin levantar el servidor (así los tests pueden inyectar
 * un repositorio en memoria y otra configuración).
 * @param {{ config: typeof import('./config.js').config, productRepo: import('./products/product.repository.js').ProductRepository }} deps
 */
export function createApp({ config, productRepo }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  const openApiSpec = buildOpenApiSpec();
  app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'CRUD Productos API',
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter(config.auth));
  app.use('/api/products', requireAuth(config.auth.jwtSecret), productsRouter(productRepo));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
