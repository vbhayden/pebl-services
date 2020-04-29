import { AuthenticationManager } from '../interfaces/authenticationManager'

import { Request, Response } from 'express';
import { Issuer, Client, TokenSet } from "openid-client";
import { UserManager } from '../interfaces/userManager';
import { auditLogger } from '../main';
import { LogCategory, Severity } from '../utils/constants';
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
        auditLogger.report(LogCategory.AUTH, Severity.INFO, "FoundIssuerClient", config.authenticationUrl, config.authenticationClientId, config.authenticationRedirectURIs, config.authenticationResponseTypes)
        this.activeClient = new issued.Client({
          client_id: config.authenticationClientId,
          client_secret: config.authenticationClientSecret,
          redirect_uris: config.authenticationRedirectURIs,
          response_types: config.authenticationResponseTypes
        });
      }).catch((err: any) => {
        auditLogger.report(LogCategory.AUTH, Severity.EMERGENCY, "OpenIDDiscoveryFail", err);
      });
  }

  validate(token: string, res: Response): void {
    if (this.activeClient) {
      this.activeClient.introspect(token)
        .then(function(result) {
          auditLogger.report(LogCategory.AUTH, Severity.INFO, "ValidatedToken", result.username, result.client_id, result.exp, result.active, result.iss, result.scope);
          res.send(result).end();
        }).catch((e) => {
          auditLogger.report(LogCategory.AUTH, Severity.NOTICE, "TokenValidationFail", e);
          res.send(403).end();
        });
    } else {
      auditLogger.report(LogCategory.AUTH, Severity.EMERGENCY, "ValidateNoAuthClient", token);
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
                  this.adjustUserPermissions(session.id, session.identity.preferred_username,
                    session.activeTokens.access_token,
                    () => {
                      if (refreshed) {
                        auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "RefreshedTokens", session.id, session.identity.preferred_username);
                      } else {
                        auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "NoRefreshTokens", session.id);
                      }
                      callback(refreshed);
                    });
                });
              } else {
                auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "TokensDontExpire", session.id);
                this.clearActiveTokens(session, callback);
              }
            } else {
              auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "NoTokensFound", session.id);
              this.clearActiveTokens(session, callback);
            }
          }).catch((e) => {
            auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "RefreshTokenFail", session.id, e);
            this.clearActiveTokens(session, callback);
          });
      } else {
        auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "NoRefreshTokenStored", session.id);
        callback(false);
      }
    } else {
      auditLogger.report(LogCategory.AUTH, Severity.EMERGENCY, "RefreshNoAuthClient", session.id);
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
            auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "LoginInvalidRedirect");
            res.status(400).end();
            return;
          }
        } catch (e) {
          auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "LoginInvalidRedirect");
          res.status(400).end();
          return;
        }
      } else {
        auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "LoginInvalidRedirect");
        res.status(400).end();
        return;
      }

      auditLogger.report(LogCategory.AUTH, Severity.INFO, "FirstLoginLeg", session.id);
      session.codeVerifier = OpenIDClient.generators.codeVerifier();
      let codeChallenge = OpenIDClient.generators.codeChallenge(session.codeVerifier)
      res.redirect(this.activeClient.authorizationUrl({
        scope: this.config.authenticationScope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      }));
    } else {
      auditLogger.report(LogCategory.AUTH, Severity.EMERGENCY, "LoginNoAuthClient", session.id);
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
              auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "LogoutInvalidRedirect", session.id, redirectUrl);
              res.status(400).end();
              return;
            }
          } catch (e) {
            auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "LogoutInvalidRedirect", session.id, redirectUrl);
            res.status(400).end();
            return;
          }

          auditLogger.report(LogCategory.AUTH, Severity.INFO, "LoggingOutRedirect", session.id, session.identity.preferred_username, redirectUrl);
          res.redirect(this.activeClient.endSessionUrl({
            id_token_hint: session.activeTokens.id_token,
            post_logout_redirect_uri: redirectUrl
          }));
        } else {
          auditLogger.report(LogCategory.AUTH, Severity.INFO, "LoggingOut", session.id, session.identity.preferred_username);
          res.redirect(this.activeClient.endSessionUrl({
            id_token_hint: session.activeTokens.id_token,
            post_logout_redirect_uri: session.redirectUrl
          }));
        }
        this.clearActiveTokens(session);
      } else {
        auditLogger.report(LogCategory.AUTH, Severity.INFO, "LoggingOutNoTokens", session.id);
        res.redirect(session.redirectUrl);
      }
    } else {
      auditLogger.report(LogCategory.AUTH, Severity.EMERGENCY, "LogoutNoAuthClient", session.id);
      res.status(503).end();
    }
  }

  getProfile(session: Express.Session, callback: (((found: boolean) => void) | Response)): void {
    if (this.activeClient) {
      if (session.activeTokens) {
        this.activeClient.userinfo(session.activeTokens.access_token)
          .then(function(userInfo) {
            session.identity = userInfo;
            auditLogger.report(LogCategory.AUTH, Severity.INFO, "GetAuthProfile", session.id, session.identity.preferred_username);
            if (callback instanceof Function) {
              callback(true);
            } else {
              callback.send(userInfo).end();
            }
          }).catch((err) => {
            auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "GetAuthProfileFail", session.id, err);
            if (callback instanceof Function) {
              this.clearActiveTokens(session, callback);
            } else {
              this.clearActiveTokens(session, () => {
                callback.status(401).end();
              });
            }
          });
      } else {
        auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "GetAuthProfileNoTokens", session.id);
        if (callback instanceof Function) {
          callback(false);
        } else {
          callback.status(401).end();
        }
      }
    } else {
      auditLogger.report(LogCategory.AUTH, Severity.EMERGENCY, "GetProfileNoAuthClient", session.id);
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

  private adjustUserPermissions(sessionId: string, userId: string, accessToken: string, callback: () => void): void {

    this.userManager.getUserRoles(userId, (roleIds: string[]) => {
      let accessTokenObject = JSON.parse(Buffer.from((accessToken.split('.')[1]), 'base64').toString('utf8'));

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

          auditLogger.report(LogCategory.AUTH, Severity.INFO, "AdjustingRoles", sessionId, userId, rolesToRemove, rolesToAdd);
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
          auditLogger.report(LogCategory.AUTH, Severity.INFO, "AdjustRolesRemoveAll", sessionId, roleIds);
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
                  this.adjustUserPermissions(session.id, session.identity.preferred_username,
                    session.activeTokens.access_token,
                    () => {
                      auditLogger.report(LogCategory.AUTH, Severity.INFO, "LoggedIn", session.id, session.identity.preferred_username);
                      res.redirect(session.redirectUrl);
                    });
                } else {
                  auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "NoProfileIdentity", session.id);
                  res.status(401).end();
                }
              });
            } else {
              auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "TokensDontExpire", session.id);
              res.status(503).end();
            }
          } else {
            auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "NoTokensFound", session.id);
            res.status(401).end();
          }
        }).catch((err) => {
          auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "redirectFail", session.id, err);
          res.status(401).end();
        });
    } else {
      auditLogger.report(LogCategory.AUTH, Severity.EMERGENCY, "RedirectNoAuthClient", session.id);
      res.status(503).end();
    }
  }
}
