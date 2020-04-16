import { AuthenticationManager } from '../interfaces/authenticationManager'

import { Request, Response } from 'express';
import { Issuer, Client, TokenSet } from "openid-client"
let OpenIDClient = require("openid-client")

export class OpenIDConnectAuthentication implements AuthenticationManager {
  private activeClient: Client | null = null;
  private config: { [key: string]: any };

  constructor(config: { [key: string]: any }) {
    this.config = config;
    OpenIDClient.Issuer.discover(config.authenticationUrl)
      .then((issued: Issuer<Client>) => {

        this.activeClient = new issued.Client({
          client_id: config.authenticationClientId,
          client_secret: config.authenticationClientSecret,
          redirect_uris: config.authenticationRedirectURIs,
          response_types: config.authenticationResponseTypes
        });
      }).catch((err: any) => {
        console.log("openid failed to discover endpoint", err);
      });
  }

  validate(token: string, res: Response): void {
    if (this.activeClient) {
      this.activeClient.introspect(token)
        .then(function(result) {
          res.send(result).end();
        }).catch((e) => {
          res.send(503).end();
        });
    } else {
      res.status(503).end();
    }
  }

  refresh(session: Express.Session, callback: (refreshed: boolean) => void): void {
    if (this.activeClient) {
      this.activeClient.refresh(session.activeTokens.refresh_token)
        .then((tokenSet) => {
          session.tokenSet = tokenSet;
          if (Object.keys(tokenSet).length != 0) {
            if (tokenSet.expires_at && tokenSet.refresh_expires_in) {
              session.accessTokenExpiration = tokenSet["expires_at"] * 1000;
              let refreshExpiration = (<any>tokenSet)["refresh_expires_in"] * 1000;
              session.refreshTokenExpiration = Date.now() + refreshExpiration;
              callback(true);
            } else {
              console.log("No expiration date set on access token");
              session.loggedIn = false;
              callback(false);
            }
          } else {
            session.loggedIn = false;
            callback(false);
          }
        }).catch((e) => {
          console.log("failed to refresh token", e);
          session.loggedIn = false;
          callback(false);
        });
    }
  }

  login(req: Request, session: Express.Session, res: Response): void {
    if (this.activeClient) {
      let redirectUrl = req.query.redirectUrl;

      //force always having redirectUrl
      if (redirectUrl) {
        try {
          let decodedRedirectUrl = decodeURIComponent(redirectUrl);
          let hostname = new URL(decodedRedirectUrl).hostname;
          if (this.config.validRedirectDomainLookup[hostname]) {
            session.redirectUrl = decodedRedirectUrl;
          } else {
            res.status(400).end();
            return;
          }
        } catch (e) {
          res.status(400).end();
          return;
        }
      } else {
        res.status(400).end();
        return;
      }

      session.codeVerifier = OpenIDClient.generators.codeVerifier();
      let codeChallenge = OpenIDClient.generators.codeChallenge(session.codeVerifier)
      res.redirect(this.activeClient.authorizationUrl({
        scope: this.config.authenticationScope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      }));
    } else {
      res.status(503).end();
    }
  }

  logout(session: Express.Session, res: Response): void {
    if (this.activeClient) {
      session.loggedIn = false;
      res.redirect(this.activeClient.endSessionUrl({
        id_token_hint: session.activeTokens.id_token,
        post_logout_redirect_uri: session.redirectUrl
      }));
    } else {
      res.status(503).end();
    }
  }

  getProfile(session: Express.Session, callback: (((found: boolean) => void) | Response)): void {
    if (this.activeClient) {
      this.activeClient.userinfo(session.activeTokens.access_token)
        .then(function(userInfo) {
          session.identity = userInfo;
          if (callback instanceof Function) {
            callback(true);
          } else {
            callback.send(userInfo).end();
          }
        }).catch((err) => {
          console.log(err);
          session.loggedIn = false;
          if (callback instanceof Function) {
            callback(false);
          } else {
            callback.status(503).end();
          }
        });
    }
  }

  isAccessTokenExpired(session: Express.Session): boolean {
    return ((session.accessTokenExpiration - Date.now()) <= 0);
  }

  isRefreshTokenExpired(session: Express.Session): boolean {
    return ((session.refreshTokenExpiration - Date.now()) <= 0);
  }

  redirect(req: Request, session: Express.Session, res: Response): void {
    let self = this;
    if (this.activeClient) {
      this.activeClient.callback(
        this.config.authenticationRedirectURIs[0],
        this.activeClient.callbackParams(req),
        { code_verifier: session.codeVerifier })
        .then((tokenSet: TokenSet) => {
          if (Object.keys(tokenSet).length != 0) {
            session.activeTokens = tokenSet;
            if (tokenSet.expires_at && tokenSet.refresh_expires_in) {
              session.accessTokenExpiration = tokenSet["expires_at"] * 1000;
              let refreshExpiration = (<any>tokenSet)["refresh_expires_in"] * 1000;
              session.refreshTokenExpiration = Date.now() + refreshExpiration;
              session.loggedIn = true;
              self.getProfile(session, (found) => {
                res.redirect(session.redirectUrl);
              });
            } else {
              console.log("No expiration date set on access token");
              res.status(503).end();
            }
          } else {
            res.status(401).end();
          }
        }).catch((err) => {
          console.log(err);
          res.status(401).end();
        });
    } else {
      res.status(503).end();
    }
  }
}
