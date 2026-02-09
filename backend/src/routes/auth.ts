import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { generateToken, verifyToken } from '../utils/jwt.js';

export const authRouter = Router();

interface LoginRequest {
  username?: string;
  password?: string;
}

authRouter.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (username !== config.auth.username || password !== config.auth.password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken({ username });
  res.json({ token, username });
});

authRouter.post('/validate', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ valid: false });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ valid: false });
    return;
  }

  res.json({ valid: true, username: payload.username });
});

authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Logged out successfully' });
});
