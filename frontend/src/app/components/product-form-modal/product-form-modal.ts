import { Component, HostListener, OnInit, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PRODUCT_CATEGORIES, Product, ProductInput } from '../../core/models/product.model';

/**
 * Modal reutilizado para crear (product = null) y editar (product != null).
 * Se monta/desmonta con @if desde el padre, por eso basta con ngOnInit.
 */
@Component({
  selector: 'app-product-form-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form-modal.html',
})
export class ProductFormModal implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly product = input<Product | null>(null);
  readonly saving = input(false);
  readonly save = output<ProductInput>();
  readonly closed = output<void>();

  readonly categories = PRODUCT_CATEGORIES;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', Validators.maxLength(200)],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  get isEdit(): boolean {
    return this.product() !== null;
  }

  ngOnInit(): void {
    const p = this.product();
    if (p) {
      this.form.setValue({
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
      });
    }
  }

  showError(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      ...value,
      name: value.name.trim(),
      description: value.description.trim(),
      price: Number(value.price),
      stock: Number(value.stock),
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.saving()) this.closed.emit();
  }
}
