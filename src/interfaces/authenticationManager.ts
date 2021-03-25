import { Request, Response } from 'express';

export interface AuthenticationManager {
  validate(token: string, req: Request, res: Response): void;
  refresh(session: Express.Session): Promise<boolean>;
  login(req: Request, session: Express.Session, res: Response): void;
  logout(req: Request, session: Express.Session, res: Response): void;
  getProfile(session: Express.Session): Promise<{ [key: string]: any } | null>;
  redirect(req: Request, session: Express.Session, res: Response): void;

  isLoggedIn(session: Express.Session): Promise<boolean>;

  // isRefreshTokenExpired(session: Express.Session): boolean;
  // isAccessTokenExpired(session: Express.Session): boolean
}
