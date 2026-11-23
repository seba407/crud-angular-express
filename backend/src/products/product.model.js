import { HttpError } from '../utils/http-error.js';

/** Debe coincidir con PRODUCT_CATEGORIES del frontend. */
export const PRODUCT_CATEGORIES = ['Electrónica', 'Hogar', 'Ropa', 'Deportes', 'Libros', 'Otros'];

/**
 * Valida y normaliza el cuerpo de crear/editar (mismas reglas que el formulario del frontend).
 * Lanza HttpError 400 con el detalle por campo si algo no es válido.
 * @returns {{ name: string, description: string, category: string, price: number, stock: number }}
 */
export function parseProductInput(body) {
  const errors = {};
  const data = body && typeof body === 'object' ? body : {};

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) errors.name = 'El nombre es obligatorio';
  else if (name.length > 80) errors.name = 'Máximo 80 caracteres';

  const description = data.description == null ? '' : data.description;
  if (typeof description !== 'string') errors.description = 'Debe ser texto';
  else if (description.trim().length > 200) errors.description = 'Máximo 200 caracteres';

  const category = data.category;
  if (!PRODUCT_CATEGORIES.includes(category)) {
    errors.category = `Debe ser una de: ${PRODUCT_CATEGORIES.join(', ')}`;
  }

  const price = data.price;
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    errors.price = 'Debe ser un número mayor o igual a 0';
  }

  const stock = data.stock;
  if (!Number.isInteger(stock) || stock < 0) {
    errors.stock = 'Debe ser un entero mayor o igual a 0';
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, 'Datos inválidos', errors);
  }

  return { name, description: description.trim(), category, price, stock };
}
