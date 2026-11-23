import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'crud.theme';

/**
 * Tema claro/oscuro. Sin preferencia guardada sigue al sistema operativo.
 * La preferencia se aplica como `data-theme` en <html> (ver tokens en styles.scss);
 * index.html la aplica antes del arranque para evitar un parpadeo.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');

  private readonly stored = signal<Theme | null>(this.readStored());
  private readonly systemDark = signal(this.media.matches);

  readonly theme = computed<Theme>(() => this.stored() ?? (this.systemDark() ? 'dark' : 'light'));
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    this.media.addEventListener('change', (e) => this.systemDark.set(e.matches));

    effect(() => {
      const stored = this.stored();
      if (stored) this.root.setAttribute('data-theme', stored);
      else this.root.removeAttribute('data-theme');
    });
  }

  toggle(): void {
    const next: Theme = this.isDark() ? 'light' : 'dark';
    this.stored.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* almacenamiento no disponible: el tema aplica solo en esta sesión */
    }
  }

  private readStored(): Theme | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }
}
