import { Request, Response } from 'express';

export interface AuthenticationManager {
  validate(token: string, res: Response): void;
  refresh(session: Express.Session, res: Response): void;
  login(req: Request, session: Express.Session, res: Response): void;
  logout(session: Express.Session, res: Response): void;
  getProfile(session: Express.Session, callback: ((() => void) | Response)): void;
  redirect(req: Request, session: Express.Session, res: Response): void;
}
