import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SEED_PRODUCTS } from './seed.js';

/**
 * Acceso a datos de productos. Mantiene la lista en memoria y, si se indica `filePath`,
 * la persiste en un archivo JSON. Para migrar a una base de datos basta con otra clase
 * que exponga los mismos métodos async (findAll, findById, create, update, remove).
 */
export class ProductRepository {
  /** @param {{ filePath?: string | null, initial?: object[] }} [options] */
  constructor({ filePath = null, initial = SEED_PRODUCTS } = {}) {
    this.filePath = filePath;
    this.initial = initial;
    this.products = null;
    this.loading = null;
  }

  async findAll() {
    return structuredClone(await this.#load());
  }

  async findById(id) {
    const product = (await this.#load()).find((p) => p.id === id);
    return product ? structuredClone(product) : null;
  }

  async create(input) {
    const products = await this.#load();
    const product = {
      id: Math.max(0, ...products.map((p) => p.id)) + 1,
      ...input,
      createdAt: new Date().toISOString(),
    };
    products.push(product);
    await this.#persist();
    return structuredClone(product);
  }

  /** @returns el producto actualizado, o null si no existe */
  async update(id, input) {
    const products = await this.#load();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...input };
    await this.#persist();
    return structuredClone(products[index]);
  }

  /** @returns true si se eliminó, false si no existía */
  async remove(id) {
    const products = await this.#load();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    await this.#persist();
    return true;
  }

  #load() {
    // Se guarda la promesa para que peticiones simultáneas compartan una única carga.
    this.loading ??= this.#readInitial();
    return this.loading;
  }

  async #readInitial() {
    if (this.filePath) {
      try {
        this.products = JSON.parse(await readFile(this.filePath, 'utf8'));
        return this.products;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }

    this.products = structuredClone(this.initial);
    await this.#persist();
    return this.products;
  }

  async #persist() {
    if (!this.filePath) return;
    await mkdir(dirname(this.filePath), { recursive: true });
    // Escribe a un temporal y renombra para no dejar el archivo a medias.
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(this.products, null, 2));
    await rename(tmp, this.filePath);
  }
}
