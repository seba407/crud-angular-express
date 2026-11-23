import { Router } from 'express';
import { HttpError } from '../utils/http-error.js';
import { parseProductInput } from './product.model.js';

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Id inválido');
  return id;
}

/** @param {import('./product.repository.js').ProductRepository} repo */
export function productsRouter(repo) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await repo.findAll());
  });

  router.get('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const product = await repo.findById(id);
    if (!product) throw new HttpError(404, `Producto ${id} no encontrado`);
    res.json(product);
  });

  router.post('/', async (req, res) => {
    const created = await repo.create(parseProductInput(req.body));
    res.status(201).location(`${req.baseUrl}/${created.id}`).json(created);
  });

  router.put('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const updated = await repo.update(id, parseProductInput(req.body));
    if (!updated) throw new HttpError(404, `Producto ${id} no encontrado`);
    res.json(updated);
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!(await repo.remove(id))) throw new HttpError(404, `Producto ${id} no encontrado`);
    res.status(204).end();
  });

  return router;
}
