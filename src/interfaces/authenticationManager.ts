import { Request, Response } from 'express';

export interface AuthenticationManager {
  validate(token: string, res: Response): void;
  refresh(session: Express.Session, callback: (refreshed: boolean) => void): void;
  login(req: Request, session: Express.Session, res: Response): void;
  logout(session: Express.Session, res: Response): void;
  getProfile(session: Express.Session, callback: (((found: boolean) => void) | Response)): void;
  redirect(req: Request, session: Express.Session, res: Response): void;

  isRefreshTokenExpired(session: Express.Session): boolean;
  isAccessTokenExpired(session: Express.Session): boolean
}
