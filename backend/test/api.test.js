import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { ProductRepository } from '../src/products/product.repository.js';

const config = {
  corsOrigin: '*',
  auth: { username: 'admin', password: 'admin', jwtSecret: 'test-secret', jwtExpiresIn: '1h' },
};

let server;
let baseUrl;
let repo;
let token;

/** Pequeño helper sobre fetch: devuelve { status, body }. */
async function api(method, path, { body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const validProduct = { name: 'Mouse', description: 'Inalámbrico', category: 'Electrónica', price: 15990, stock: 3 };

before(async () => {
  // El repo se reemplaza en cada test; la app lo lee a través de este objeto proxy.
  const repoProxy = new Proxy({}, { get: (_t, prop) => repo[prop].bind(repo) });
  const app = createApp({ config, productRepo: repoProxy });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  // Token compartido para que cada test pueda ejecutarse de forma aislada.
  const login = await api('POST', '/auth/login', { body: { username: 'admin', password: 'admin' }, auth: false });
  token = login.body.token;
});

after(() => server.close());

beforeEach(() => {
  repo = new ProductRepository(); // en memoria, con los datos semilla
});

describe('auth', () => {
  it('login correcto devuelve token y usuario', async () => {
    const res = await api('POST', '/auth/login', { body: { username: 'admin', password: 'admin' }, auth: false });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.deepEqual(res.body.user, { username: 'admin', name: 'Administrador' });
  });

  it('credenciales incorrectas → 401', async () => {
    const res = await api('POST', '/auth/login', { body: { username: 'admin', password: 'x' }, auth: false });
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Usuario o contraseña incorrectos');
  });

  it('body vacío → 400', async () => {
    const res = await api('POST', '/auth/login', { body: {}, auth: false });
    assert.equal(res.status, 400);
  });

  it('/me con token devuelve el usuario', async () => {
    const res = await api('GET', '/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.body.username, 'admin');
  });

  it('productos sin token → 401', async () => {
    const res = await api('GET', '/products', { auth: false });
    assert.equal(res.status, 401);
  });

  it('token inválido → 401', async () => {
    const saved = token;
    token = 'no-es-un-jwt';
    const res = await api('GET', '/products');
    token = saved;
    assert.equal(res.status, 401);
  });
});

describe('products', () => {
  it('lista los productos semilla', async () => {
    const res = await api('GET', '/products');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 6);
  });

  it('obtiene uno por id y 404 si no existe', async () => {
    assert.equal((await api('GET', '/products/1')).body.id, 1);
    assert.equal((await api('GET', '/products/999')).status, 404);
    assert.equal((await api('GET', '/products/abc')).status, 400);
  });

  it('crea un producto', async () => {
    const res = await api('POST', '/products', { body: validProduct });
    assert.equal(res.status, 201);
    assert.equal(res.body.id, 7);
    assert.equal(res.body.name, 'Mouse');
    assert.ok(res.body.createdAt);
    assert.equal((await api('GET', '/products')).body.length, 7);
  });

  it('rechaza datos inválidos con detalle por campo', async () => {
    const res = await api('POST', '/products', {
      body: { name: '  ', category: 'Juguetes', price: -1, stock: 1.5 },
    });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.errors).sort(), ['category', 'name', 'price', 'stock']);
  });

  it('JSON mal formado → 400', async () => {
    const res = await api('POST', '/products', { body: '{malo' });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'JSON inválido');
  });

  it('actualiza un producto conservando id y createdAt', async () => {
    const before = (await api('GET', '/products/2')).body;
    const res = await api('PUT', '/products/2', { body: { ...validProduct, name: 'Editado' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Editado');
    assert.equal(res.body.id, 2);
    assert.equal(res.body.createdAt, before.createdAt);
    assert.equal((await api('PUT', '/products/999', { body: validProduct })).status, 404);
  });

  it('elimina un producto', async () => {
    assert.equal((await api('DELETE', '/products/3')).status, 204);
    assert.equal((await api('GET', '/products/3')).status, 404);
    assert.equal((await api('DELETE', '/products/3')).status, 404);
  });
});

describe('otros', () => {
  it('health check', async () => {
    const res = await api('GET', '/health', { auth: false });
    assert.deepEqual(res.body, { status: 'ok' });
  });

  it('sirve la especificación OpenAPI y Swagger UI', async () => {
    const spec = await api('GET', '/docs.json', { auth: false });
    assert.equal(spec.status, 200);
    assert.equal(spec.body.openapi, '3.0.3');
    assert.ok(spec.body.paths['/products/{id}'].delete);

    const ui = await fetch(`${baseUrl}/docs/`);
    assert.equal(ui.status, 200);
    assert.match(await ui.text(), /swagger-ui/i);
  });

  it('ruta desconocida → 404 JSON', async () => {
    const res = await api('GET', '/nada', { auth: false });
    assert.equal(res.status, 404);
    assert.ok(res.body.message);
  });
});
