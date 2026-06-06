import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { loginSchema } from '../schemas/auth';

const router = Router();

router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ message: 'Email atau password salah' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: 'Email atau password salah' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
