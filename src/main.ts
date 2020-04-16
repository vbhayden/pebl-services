import * as bodyParser from "body-parser";

import * as redis from 'redis'
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

import { Request, Response } from 'express';
import * as WebSocket from 'ws';
import { OpenIDConnectAuthentication } from './plugins/openidConnect';

import { RedisSessionDataCache } from './plugins/sessionCache';
import { RedisMessageQueuePlugin } from './plugins/messageQueue';
import { DefaultAuthorizationManager } from './plugins/authorizationManager'
import { DefaultValidationManager } from './plugins/validationManager'
import { ValidationManager } from "./interfaces/validationManager";
import { AuthorizationManager } from "./interfaces/authorizationManager";
import { SessionDataManager } from "./interfaces/sessionDataManager";
import { MessageQueueManager } from "./interfaces/messageQueueManager";
import { AuthenticationManager } from "./interfaces/authenticationManager";
import { ServiceMessage } from "./models/serviceMessage";
import { GroupManager } from "./interfaces/groupManager";
import { DefaultGroupManager } from "./plugins/groupManager";
import { UserManager } from "./interfaces/userManager";
import { RoleManager } from "./interfaces/roleManager";
import { DefaultUserManager } from "./plugins/userManager";
import { DefaultRoleManager } from "./plugins/roleManager";
import { PluginManager } from "./interfaces/pluginManager";
import { DefaultPluginManager } from "./plugins/pluginManager";
import { ActivityManager } from "./interfaces/activityManager";
import { DefaultActivityManager } from "./plugins/activityManager";
import { AnnotationManager } from "./interfaces/annotationManager";
import { DefaultAnnotationManager } from "./plugins/annotationManager";
import { EventManager } from "./interfaces/eventManager";
import { DefaultEventManager } from "./plugins/eventManager";
import { AssetManager } from "./interfaces/assetManager";
import { DefaultAssetManager } from "./plugins/assetManager";
import { CompetencyManager } from "./interfaces/competencyManager";
import { DefaultCompetencyManager } from "./plugins/competencyManager";
import { MembershipManager } from "./interfaces/membershipManager";
import { DefaultMembershipManager } from "./plugins/membershipManager";
import { MessageManager } from "./interfaces/messageManager";
import { ModuleEventsManager } from "./interfaces/moduleEventsManager";
import { DefaultModuleEventsManager } from "./plugins/moduleEventsManager";
import { NotificationManager } from "./interfaces/notificationManager";
import { DefaultNotificationManager } from "./plugins/notificationManager";
import { DefaultMessageManager } from "./plugins/messageManager";
import { ThreadManager } from "./interfaces/threadManager";
import { DefaultThreadManager } from "./plugins/threadManager";
import { ReferenceManager } from "./interfaces/referenceManager";
import { DefaultReferenceManager } from "./plugins/referenceManager";
import { ActionManager } from "./interfaces/actionManager";
import { DefaultActionManager } from "./plugins/actionManager";
import { SessionManager } from "./interfaces/sessionManager";
import { DefaultSessionManager } from "./plugins/sessionManager";
import { LRS } from "./interfaces/lrsManager";
import { LRSPlugin } from "./plugins/lrs";
import { Endpoint } from "./models/endpoint";

let express = require('express');

let expressApp = express();

if (process.argv.length < 3) {
  console.log("command should include a path to the server configuration json");
  console.log("node <pathToScript> <pathToConfigurationJson>");
  process.exit();
}

const config: { [key: string]: any } = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

let validRedirectDomainLookup: { [key: string]: boolean } = {};
for (let validDomain of config.validRedirectDomains) {
  validRedirectDomainLookup[validDomain] = true;
}
config.validRedirectDomainLookup = validRedirectDomainLookup;
let privKey;
let cert;
let credentials: { [key: string]: any } = {};
let httpsServer;

let expressSession = require('express-session');
let RedisSessionStore = require('connect-redis')(expressSession);

const redisClient = redis.createClient({
  password: config.redisAuth
});

const pluginManager: PluginManager = new DefaultPluginManager();
const redisCache: SessionDataManager = new RedisSessionDataCache(redisClient);
const userManager: UserManager = new DefaultUserManager(redisCache);
const groupManager: GroupManager = new DefaultGroupManager(redisCache, userManager);
const roleManager: RoleManager = new DefaultRoleManager(redisCache, userManager);
const activityManager: ActivityManager = new DefaultActivityManager(redisCache);
const annotationManager: AnnotationManager = new DefaultAnnotationManager(redisCache);
const eventManager: EventManager = new DefaultEventManager(redisCache);
const assetManager: AssetManager = new DefaultAssetManager(redisCache);
const competencyManager: CompetencyManager = new DefaultCompetencyManager(redisCache);
const membershipManager: MembershipManager = new DefaultMembershipManager(redisCache);
const messageManager: MessageManager = new DefaultMessageManager(redisCache);
const moduleEventsManager: ModuleEventsManager = new DefaultModuleEventsManager(redisCache);
const notificationManager: NotificationManager = new DefaultNotificationManager(redisCache);
const threadManager: ThreadManager = new DefaultThreadManager(redisCache);
const referenceManager: ReferenceManager = new DefaultReferenceManager(redisCache);
const actionManager: ActionManager = new DefaultActionManager(redisCache);
const sessionManager: SessionManager = new DefaultSessionManager(redisCache);
const lrsManager: LRS = new LRSPlugin(new Endpoint({
  url: config.lrsUrl,
  headers: config.lrsHeaders
}));

const authorizationManager: AuthorizationManager = new DefaultAuthorizationManager(pluginManager, groupManager, userManager, roleManager);
const validationManager: ValidationManager = new DefaultValidationManager(pluginManager);

pluginManager.register(groupManager);
pluginManager.register(roleManager);
pluginManager.register(userManager);
pluginManager.register(activityManager);
pluginManager.register(annotationManager);
pluginManager.register(eventManager);
pluginManager.register(assetManager);
pluginManager.register(competencyManager);
pluginManager.register(membershipManager);
pluginManager.register(messageManager);
pluginManager.register(moduleEventsManager);
pluginManager.register(notificationManager);
pluginManager.register(threadManager);
pluginManager.register(referenceManager);
pluginManager.register(actionManager);
pluginManager.register(sessionManager);

roleManager.addRole("systemAdmin", "System Admin", Object.keys(pluginManager.getMessageTemplates()));

let systemAdminRoles = ["systemAdmin"];
for (let systemAdmin of config.systemAdmins) {
  userManager.addUserRoles(systemAdmin, systemAdminRoles);
}

const messageQueue: MessageQueueManager = new RedisMessageQueuePlugin({
  client: redisClient,
  options: {
    password: config.redisAuth
  },
  ns: 'rsmq',
  realtime: true
}, pluginManager, redisCache, lrsManager);

messageQueue.initialize();

const authenticationManager: AuthenticationManager = new OpenIDConnectAuthentication(config);

if (config.useSSL) {
  privKey = fs.readFileSync(config.privateKeyPath, "utf8");
  cert = fs.readFileSync(config.certificatePath, "utf8");

  credentials = {
    serverName: config.serverName,
    key: privKey,
    cert: cert
  };

  httpsServer = https.createServer(credentials, expressApp);
} else {
  httpsServer = http.createServer(expressApp);
}

expressApp = require('express-ws')(expressApp, httpsServer).app;

// Potentially needed for CORS
var allowCrossDomain = function(req: Request, res: Response, next: Function) {
  let originUrl = <string>req.headers["origin"];
  try {
    if (originUrl) {
      let origin = new URL(originUrl).hostname;
      if (validRedirectDomainLookup[origin]) {
        res.header('Access-Control-Allow-Origin', originUrl);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
      }
    }
  } catch (e) {
    // console.log("bad origin url", e);
  }
  next();
}

expressApp.use(allowCrossDomain);

redisClient.on("error", function(error) {
  console.error("Redis Client", error);
});

expressApp.use(
  expressSession({
    store: new RedisSessionStore({ client: redisClient, ttl: config.sessionTTL }),
    secret: config.sessionSecret,
    cookie: {
      secure: config.useSSL,
      httpOnly: true,
      maxAge: (config.sessionTTL * 1000), //wants time in milliseconds
      sameSite: config.cookieSameSite
    },
    name: "s",
    proxy: config.usesProxy,
    saveUninitialized: false,
    resave: false
  })
);

// Make sure session exists
// expressApp.use(function(req: Request, res: Response, next: Function) {
//     if (!req.session) {
//         return next(new Error("error"));
//     }
// });

expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(bodyParser.json());

expressApp.disable('x-powered-by');

expressApp.get('/', function(req: Request, res: Response) {
  console.log(req.session?.id)
  res.send("Hello World!").end();
});

expressApp.get('/login', function(req: Request, res: Response) {
  if (req.session) {
    console.log("logging in", req.session.id, req.session.loggedIn);
    if (!req.session.loggedIn) {
      authenticationManager.login(req, req.session, res);
    } else {
      let redirectUrl = req.query["redirectUrl"];
      if (redirectUrl) {
        let origin = new URL(redirectUrl).hostname;
        if (validRedirectDomainLookup[origin]) {
          res.redirect(redirectUrl);
        }
      } else {
        res.redirect(req.session.redirectUrl);
      }
    }
  }
});

expressApp.get('/redirect', function(req: Request, res: Response) {
  if (req.session) {
    if (!req.session.loggedIn) {
      authenticationManager.redirect(req, req.session, res);
    } else {
      res.status(200).end();
    }
  } else {
    res.status(503).end();
  }
});

expressApp.get('/logout', function(req: Request, res: Response) {
  if (req.session) {
    console.log("logging out", req.session.id, req.session.loggedIn)
    if (req.session.loggedIn) {
      authenticationManager.logout(req.session, res);
    } else {
      res.status(200).end();
    }
  } else {
    res.status(503).end();
  }
});

expressApp.get('/user/profile', function(req: Request, res: Response) {
  if (req.session) {
    console.log("user profile", req.session.id, req.session.loggedIn);
    if (req.session.loggedIn) {
      if (authenticationManager.isAccessTokenExpired(req.session)) {
        if (authenticationManager.isRefreshTokenExpired(req.session)) {
          res.status(401).end();
        } else {
          authenticationManager.refresh(req.session, (refreshed: boolean) => {
            if (refreshed) {
              if (req.session) {
                authenticationManager.getProfile(req.session, res);
              }
            } else {
              if (req.session) {
                res.status(401).end();
              }
            }
          });
        }
      } else {
        authenticationManager.getProfile(req.session, res);
      }
    } else {
      res.status(401).end();
    }
  } else {
    res.status(503).end();
  }
});

// expressApp.get('/refresh', function(req: Request, res: Response) {
//   if (req.session) {
//     if (req.session.loggedIn) {
//       authenticationManager.refresh(req.session, res);
//     } else {
//       res.status(401).end();
//     }
//   } else {
//     res.status(503).end();
//   }
// });

expressApp.post('/validate', function(req: Request, res: Response) {
  authenticationManager.validate(req.body.token, res);
});

// expressApp.ws('/', function(ws: WebSocket, req: Request) {
//   if (req.session) {
//     if (req.session.loggedIn) {
//       ws.on('message', function(msg: String) {

//       });
//       ws.send("ping");
//     } else {
//       ws.terminate();
//     }
//   }
// });

let processIncomingMessages = (req: Request, payload: { [key: string]: any }): void => {
  if (req && req.session) {
    authorizationManager.assemblePermissionSet(req.session.identity.preferred_username,
      req.session,
      () => {
        if (req.session) {
          let authorized = authorizationManager.authorize(req.session.activeTokens.id_token.username,
            req.session.permissions,
            payload);
          console.log("isAuthorized", authorized);
          if (authorized) {
            // let serviceMessage = new ServiceMessage({
            //   sessionId: req.session.id,
            //   identity: "learner",
            //   payload: payload
            // });

            // messageQueue.enqueueIncomingMessage(serviceMessage, function(success: boolean) { });

          } else {
            console.log("Not authorized", req.session.activeTokens.id_token.username, payload);
          }
        } else {
          console.log("invalid session");
        }
      });
  }
};

expressApp.ws('/', function(ws: WebSocket, req: Request) {
  let originUrl = <string>req.headers["origin"];

  let origin;
  try {
    origin = new URL(originUrl).hostname;
  } catch (e) {
    origin = "null";
  }
  if (!validRedirectDomainLookup[origin]) {
    ws.terminate();
  } else {

    if (req.session) {
      // messageQueue.createOutgoingQueue(req.session.id, ws, function(success: boolean) { });
      // messageQueue.subscribeNotifications("learner", req.session.id, ws, function(success: boolean) { });
    }

    ws.on('message', function(msg) {
      if (req.session) {
        if (typeof msg === 'string') {
          let payload: any;
          try {
            payload = JSON.parse(msg);
            if (!validationManager.validate(payload)) {
              ws.send("Invalid Message");
              return;
            }
          } catch (e) {
            ws.send("Invalid Message");
            return;
          }

          if (authenticationManager.isAccessTokenExpired(req.session)) {
            if (authenticationManager.isRefreshTokenExpired(req.session)) {
              req.session.loggedIn = false;
              ws.send(JSON.stringify({
                requestType: "loggedOut"
              }));
            } else {
              authenticationManager.refresh(req.session, (refreshed: boolean) => {
                if (refreshed) {
                  processIncomingMessages(req, payload);
                } else {
                  if (req.session) {
                    ws.send(JSON.stringify({
                      requestType: "loggedOut"
                    }));
                  }
                }
              })
            }
          } else {
            processIncomingMessages(req, payload);
          }
        }
      } else {
        ws.terminate();
      }
    });

    ws.on('close', function() {
      if (req.session) {
        // messageQueue.removeOutgoingQueue(req.session.id);
        // messageQueue.unsubscribeNotifications(req.session.activeTokens.id_token.username);
      }
    })
  }
});

expressApp.ws('/message', function(ws: WebSocket, req: Request) {
  if (req.session) {
    messageQueue.createOutgoingQueue(req.session.id, ws, function(success: boolean) { });
    messageQueue.subscribeNotifications("learner", req.session.id, ws, function(success: boolean) { });
  }

  ws.on('message', function(msg) {
    console.log('message');
    if (req.session) {
      //TODO: Validate & Authorize
      if (typeof msg === 'string') {
        let payload;
        try {
          payload = JSON.parse(msg);
        } catch (e) {
          ws.send("Invalid Message");
          return;
        }

        let serviceMessage = new ServiceMessage({
          sessionId: req.session.id,
          identity: "learner",
          payload: payload
        });


        messageQueue.enqueueIncomingMessage(serviceMessage, function(success: boolean) { });
      }
    } else {
      ws.terminate();
    }
  });

  ws.on('close', function() {
    if (req.session) {
      messageQueue.removeOutgoingQueue(req.session.id);
      messageQueue.unsubscribeNotifications(req.session.activeTokens.id_token.username);
    }
  })
});

httpsServer.listen(config.port, function() {
  console.log(`listening on port ${config.port}`);
});
