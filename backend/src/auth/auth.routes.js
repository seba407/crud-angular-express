import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http-error.js';
import { requireAuth } from './auth.middleware.js';

/** @param {{ username: string, password: string, jwtSecret: string, jwtExpiresIn: string }} authConfig */
export function authRouter(authConfig) {
  const router = Router();

  router.post('/login', (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      throw new HttpError(400, 'Usuario y contraseña son obligatorios');
    }
    if (username.trim() !== authConfig.username || password !== authConfig.password) {
      throw new HttpError(401, 'Usuario o contraseña incorrectos');
    }

    const user = { username: authConfig.username, name: 'Administrador' };
    const token = jwt.sign(user, authConfig.jwtSecret, {
      subject: user.username,
      expiresIn: authConfig.jwtExpiresIn,
    });
    res.json({ token, user });
  });

  router.get('/me', requireAuth(authConfig.jwtSecret), (req, res) => {
    res.json(req.user);
  });

  return router;
}
