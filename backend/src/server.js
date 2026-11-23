import { createApp } from './app.js';
import { config, usingDevSecret } from './config.js';
import { ProductRepository } from './products/product.repository.js';

if (usingDevSecret) {
  console.warn('⚠  JWT_SECRET no definido: usando un secreto de desarrollo. No usar así en producción.');
}

const app = createApp({
  config,
  productRepo: new ProductRepository({ filePath: config.dataFile }),
});

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}/api`);
});
