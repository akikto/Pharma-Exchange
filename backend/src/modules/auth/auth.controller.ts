import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authService } from './auth.service';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ message: 'Registration successful. Please verify OTP.', ...result });
    } catch (err) { next(err); }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) { next(err); }
  }

  async firebaseAuth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { idToken, firstName, lastName } = req.body;
      const result = await authService.firebaseAuth(idToken, firstName, lastName);
      res.json(result);
    } catch (err) { next(err); }
  }

  async verifyOtp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyOtp(req.body);
      res.json(result);
    } catch (err) { next(err); }
  }

  async sendOtp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.sendOtp(req.body);
      res.json(result);
    } catch (err) { next(err); }
  }

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      res.json(result);
    } catch (err) { next(err); }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.logout(req.user!.userId, req.body.refreshToken);
      res.json(result);
    } catch (err) { next(err); }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json(user);
    } catch (err) { next(err); }
  }

  async registerFcmToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token, deviceId, platform } = req.body;
      const result = await authService.registerFcmToken(req.user!.userId, token, deviceId, platform);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async removeFcmToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.removeFcmToken(req.user!.userId, req.body.token);
      res.json(result);
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();
