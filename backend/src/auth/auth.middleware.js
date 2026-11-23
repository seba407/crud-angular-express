import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http-error.js';

/** Exige `Authorization: Bearer <token>` válido y deja el usuario en `req.user`. */
export function requireAuth(secret) {
  return (req, _res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new HttpError(401, 'No autenticado'));
    }
    try {
      const payload = jwt.verify(token, secret);
      req.user = { username: payload.username, name: payload.name };
      next();
    } catch {
      next(new HttpError(401, 'Sesión inválida o expirada'));
    }
  };
}
