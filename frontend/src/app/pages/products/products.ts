import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { ApiError } from '../../core/api/api-error';
import { ProductService } from '../../core/services/product.service';
import { PRODUCT_CATEGORIES, Product, ProductInput } from '../../core/models/product.model';
import { ProductFormModal } from '../../components/product-form-modal/product-form-modal';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, DatePipe, ProductFormModal, ConfirmDialog],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class ProductsPage implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly categories = PRODUCT_CATEGORIES;

  // Estado del listado
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly categoryFilter = signal('');

  // Estado del modal crear/editar
  readonly modalOpen = signal(false);
  readonly editing = signal<Product | null>(null);
  readonly saving = signal(false);

  // Estado del diálogo de borrado
  readonly toDelete = signal<Product | null>(null);
  readonly deleting = signal(false);

  readonly toasts = signal<Toast[]>([]);

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const cat = this.categoryFilter();
    return this.products().filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)),
    );
  });

  readonly stats = computed(() => {
    const list = this.products();
    return {
      total: list.length,
      units: list.reduce((acc, p) => acc + p.stock, 0),
      value: list.reduce((acc, p) => acc + p.price * p.stock, 0),
      outOfStock: list.filter((p) => p.stock === 0).length,
    };
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getAll().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.notify('error', err.message);
      },
    });
  }

  // ---- Crear / Editar ----
  openCreate(): void {
    this.editing.set(null);
    this.modalOpen.set(true);
  }

  openEdit(product: Product): void {
    this.editing.set(product);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editing.set(null);
  }

  saveProduct(input: ProductInput): void {
    const current = this.editing();
    this.saving.set(true);

    const request$ = current
      ? this.productService.update(current.id, input)
      : this.productService.create(input);

    request$.subscribe({
      next: (saved) => {
        this.products.update((list) =>
          current ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved],
        );
        this.saving.set(false);
        this.closeModal();
        this.notify('success', current ? 'Producto actualizado' : 'Producto creado');
      },
      error: (err: Error) => {
        this.saving.set(false);
        const fieldErrors = err instanceof ApiError && err.errors ? Object.values(err.errors) : [];
        this.notify('error', fieldErrors.length ? `${err.message}: ${fieldErrors.join('. ')}` : err.message);
      },
    });
  }

  // ---- Eliminar ----
  askDelete(product: Product): void {
    this.toDelete.set(product);
  }

  confirmDelete(): void {
    const product = this.toDelete();
    if (!product) return;
    this.deleting.set(true);

    this.productService.delete(product.id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p.id !== product.id));
        this.deleting.set(false);
        this.toDelete.set(null);
        this.notify('success', 'Producto eliminado');
      },
      error: (err: Error) => {
        this.deleting.set(false);
        this.toDelete.set(null);
        this.notify('error', err.message);
      },
    });
  }

  // ---- Otros ----
  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onCategoryChange(event: Event): void {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.search.set('');
    this.categoryFilter.set('');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private notify(type: Toast['type'], message: string): void {
    const id = Date.now() + Math.random();
    this.toasts.update((t) => [...t, { id, type, message }]);
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), 3000);
  }
}
