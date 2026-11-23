import { HttpErrorResponse } from '@angular/common/http';

/**
 * Error normalizado de la API. Los componentes solo usan `message`
 * (y opcionalmente `errors`, el detalle por campo de una validación 400).
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Traduce la respuesta HTTP al formato `{ message, errors? }` del backend. */
  static fromHttp(err: HttpErrorResponse): ApiError {
    if (err.status === 0) {
      return new ApiError(0, 'No se pudo conectar con el servidor. ¿Está el backend en ejecución?');
    }
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.message === 'string') {
      return new ApiError(err.status, body.message, body.errors);
    }
    if (err.status >= 500) {
      return new ApiError(err.status, 'Error del servidor. Inténtalo nuevamente.');
    }
    return new ApiError(err.status, `Error inesperado (${err.status})`);
  }
}
