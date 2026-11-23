import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="backdrop" (click)="!loading() && cancelled.emit()"></div>
    <div class="modal modal--sm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <header class="modal__header">
        <h2 id="confirm-title">{{ title() }}</h2>
      </header>
      <div class="modal__body">
        <p class="confirm-message">{{ message() }}</p>
      </div>
      <footer class="modal__footer">
        <button type="button" class="btn btn--ghost" (click)="cancelled.emit()" [disabled]="loading()">Cancelar</button>
        <button type="button" class="btn btn--danger" (click)="confirmed.emit()" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Eliminando… } @else { {{ confirmText() }} }
        </button>
      </footer>
    </div>
  `,
})
export class ConfirmDialog {
  readonly title = input('¿Estás seguro?');
  readonly message = input('');
  readonly confirmText = input('Eliminar');
  readonly loading = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.loading()) this.cancelled.emit();
  }
}
