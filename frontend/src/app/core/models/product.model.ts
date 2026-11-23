export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  createdAt: string;
}

/** Datos que envía el formulario (sin campos generados por el servidor). */
export type ProductInput = Omit<Product, 'id' | 'createdAt'>;

export const PRODUCT_CATEGORIES = ['Electrónica', 'Hogar', 'Ropa', 'Deportes', 'Libros', 'Otros'] as const;
