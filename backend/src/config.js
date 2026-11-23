const DEV_SECRET = 'dev-secret-cambiar-en-produccion';

export const config = {
  port: Number(process.env.PORT) || 3000,
  /** Origen permitido por CORS (el frontend de Angular en desarrollo). */
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',

  auth: {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
    jwtSecret: process.env.JWT_SECRET || DEV_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  /** Archivo JSON donde se persisten los productos. */
  dataFile: process.env.DATA_FILE || 'data/products.json',
};

export const usingDevSecret = config.auth.jwtSecret === DEV_SECRET;
