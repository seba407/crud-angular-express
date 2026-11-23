import { HttpError } from '../utils/http-error.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

/** Todas las respuestas de error tienen la forma { message, errors? }. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.errors && { errors: err.errors }) });
  }
  // JSON mal formado en el body (lanzado por express.json()).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido' });
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
}
