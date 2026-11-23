import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api/api.config';
import { Product, ProductInput } from '../models/product.model';

/** CRUD de productos contra el backend (ver /api/docs). */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/products`;

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.url);
  }

  create(input: ProductInput): Observable<Product> {
    return this.http.post<Product>(this.url, input);
  }

  update(id: number, input: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${this.url}/${id}`, input);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
