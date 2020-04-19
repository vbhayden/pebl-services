import { AuthenticationManager } from '../interfaces/authenticationManager'

import { Request, Response } from 'express';
import { Issuer, Client, TokenSet } from "openid-client";
import { UserManager } from '../interfaces/userManager';
let OpenIDClient = require("openid-client")

export class OpenIDConnectAuthentication implements AuthenticationManager {
  private activeClient: Client | null = null;
  private config: { [key: string]: any };
  private userManager: UserManager;

  constructor(config: { [key: string]: any }, userManager: UserManager) {
    this.config = config;
    this.userManager = userManager;
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
          console.log("token validation failed", e);
          res.send(503).end();
        });
    } else {
      res.status(503).end();
    }
  }

  refresh(session: Express.Session, callback: (refreshed: boolean) => void): void {
    if (this.activeClient) {
      if (session.activeTokens) {
        this.activeClient.refresh(session.activeTokens.refresh_token)
          .then((tokenSet) => {
            if (Object.keys(tokenSet).length != 0) {
              session.activeTokens = tokenSet;
              if (tokenSet.expires_at && tokenSet.refresh_expires_in) {
                session.accessTokenExpiration = tokenSet["expires_at"] * 1000;
                let refreshExpiration = (<any>tokenSet)["refresh_expires_in"] * 1000;
                session.refreshTokenExpiration = Date.now() + refreshExpiration;
                this.getProfile(session, (refreshed: boolean) => {
                  this.adjustUserPermissions(session.identity.preferred_username,
                    session.activeTokens.access_token,
                    () => {
                      callback(refreshed);
                    });
                });
              } else {
                console.log("No expiration date set on access token");
                this.clearActiveTokens(session, callback);
              }
            } else {
              this.clearActiveTokens(session, callback);
            }
          }).catch((e) => {
            console.log("failed to refresh token", e);
            this.clearActiveTokens(session, callback);
          });
      } else {
        console.log("failed to refresh token, none stored");
        callback(false);
      }
    }
  }

  login(req: Request, session: Express.Session, res: Response): void {
    if (this.activeClient) {
      let redirectUrl = req.query.redirectUrl;
      if (redirectUrl) {
        try {
          let hostname = new URL(redirectUrl).hostname;
          if (this.config.validRedirectDomainLookup[hostname]) {
            session.redirectUrl = redirectUrl;
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

  logout(req: Request, session: Express.Session, res: Response): void {
    if (this.activeClient) {

      if (session.activeTokens) {
        let redirectUrl = req.query.redirectUrl;
        if (redirectUrl) {
          try {
            let hostname = new URL(redirectUrl).hostname;
            if (!this.config.validRedirectDomainLookup[hostname]) {
              res.status(400).end();
              return;
            }
          } catch (e) {
            res.status(400).end();
            return;
          }

          res.redirect(this.activeClient.endSessionUrl({
            id_token_hint: session.activeTokens.id_token,
            post_logout_redirect_uri: redirectUrl
          }));
        } else {
          res.redirect(this.activeClient.endSessionUrl({
            id_token_hint: session.activeTokens.id_token,
            post_logout_redirect_uri: session.redirectUrl
          }));
        }
        this.clearActiveTokens(session);
      } else {
        res.redirect(session.redirectUrl);
      }
    } else {
      res.status(503).end();
    }
  }

  getProfile(session: Express.Session, callback: (((found: boolean) => void) | Response)): void {
    if (this.activeClient) {
      if (session.activeTokens) {
        this.activeClient.userinfo(session.activeTokens.access_token)
          .then(function(userInfo) {
            session.identity = userInfo;
            if (callback instanceof Function) {
              callback(true);
            } else {
              callback.send(userInfo).end();
            }
          }).catch((err) => {
            console.log("Get Profiled failed", err);
            if (callback instanceof Function) {
              this.clearActiveTokens(session, callback);
            } else {
              this.clearActiveTokens(session, () => {
                callback.status(401).end();
              });
            }
          });
      } else {
        if (callback instanceof Function) {
          callback(false);
        } else {
          callback.status(401).end();
        }
      }
    }
  }

  private clearActiveTokens(session: Express.Session, callback?: (isLoggedIn: false) => void): void {
    delete session.activeTokens;
    delete session.accessTokenExpiration;
    delete session.refreshTokenExpiration;
    session.save(() => {
      if (callback) callback(false);
    });
  }

  isLoggedIn(session: Express.Session, callback: (isLoggedIn: boolean) => void): void {
    if (session.activeTokens) {
      if (this.isAccessTokenExpired(session)) {
        if (this.isRefreshTokenExpired(session)) {
          this.clearActiveTokens(session, callback);
        } else {
          this.refresh(session, (refreshed: boolean) => {
            session.save(() => {
              if (refreshed) {
                callback(true);
              } else {
                this.clearActiveTokens(session, callback);
              }
            });
          });
        }
      } else {
        callback(true);
      }
    } else {
      callback(false);
    }
  }

  private isAccessTokenExpired(session: Express.Session): boolean {
    if (session.accessTokenExpiration) {
      return ((session.accessTokenExpiration - Date.now()) <= 0);
    }
    return true;
  }

  private isRefreshTokenExpired(session: Express.Session): boolean {
    if (session.refreshTokenExpiration) {
      return ((session.refreshTokenExpiration - Date.now()) <= 0);
    }
    return true;
  }

  private adjustUserPermissions(userId: string, accessToken: string, callback: () => void): void {

    this.userManager.getUserRoles(userId, (roleIds: string[]) => {
      let accessTokenObject = JSON.parse(new Buffer((accessToken.split('.')[1]), 'base64').toString());

      console.log("accessToken", accessTokenObject);

      let removeRoles = (roles: string[], done: () => void) => {
        let role = roles.pop();
        if (role) {
          this.userManager.deleteUserRole(userId,
            role,
            () => {
              removeRoles(roles, done);
            });
        } else {
          done();
        }
      }
      if (accessTokenObject.resource_access) {
        let rolesToRemove: string[] = [];
        let rolesToAdd: string[] = [];
        let ps = accessTokenObject.resource_access["PeBL-Services"];
        if (ps && ps.roles) {
          for (let incomingRole of ps.roles) {
            let found = false;
            for (let roleId of roleIds) {
              if (roleId === incomingRole) {
                found = true;
                break;
              }
            }
            if (!found) {
              rolesToAdd.push(incomingRole);
            }
          }
          for (let roleId of roleIds) {
            let found = false;
            for (let incomingRole of ps.roles) {
              if (roleId === incomingRole) {
                found = true;
                break;
              }
            }
            if (!found) {
              rolesToRemove.push(roleId);
            }
          }

          console.log("adjusting", rolesToRemove, rolesToAdd);

          removeRoles(rolesToRemove, () => {
            if (rolesToAdd.length > 0) {
              this.userManager.addUserRoles(userId, rolesToAdd, (added: boolean) => {
                callback();
              });
            } else {
              callback();
            }
          });
        } else {
          console.log("adjusting, remove all", roleIds);
          removeRoles(roleIds, callback);
        }
      }
    });
  }

  redirect(req: Request, session: Express.Session, res: Response): void {
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
              this.getProfile(session, (found) => {
                if (found) {
                  this.adjustUserPermissions(session.identity.preferred_username,
                    session.activeTokens.access_token,
                    () => {
                      res.redirect(session.redirectUrl);
                    });
                } else {
                  console.log("Missing profile identity on redirect");
                }
              });
            } else {
              console.log("No expiration date set on access token");
              res.status(503).end();
            }
          } else {
            res.status(401).end();
          }
        }).catch((err) => {
          console.log("redirect failed", err);
          res.status(401).end();
        });
    } else {
      res.status(503).end();
    }
  }
}
