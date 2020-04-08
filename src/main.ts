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
const groupManager: GroupManager = new DefaultGroupManager(redisCache);
const userManager: UserManager = new DefaultUserManager(redisCache);
const roleManager: RoleManager = new DefaultRoleManager(redisCache);
const activityManager: ActivityManager = new DefaultActivityManager(redisCache);
const annotationManager: AnnotationManager = new DefaultAnnotationManager(redisCache);
const eventManager: EventManager = new DefaultEventManager(redisCache);
const assetManager: AssetManager = new DefaultAssetManager(redisCache);
const competencyManager: CompetencyManager = new DefaultCompetencyManager(redisCache);
const membershipManager: MembershipManager = new DefaultMembershipManager(redisCache);
const messageManager: MessageManager = new DefaultMessageManager(redisCache);
const moduleEventsManager: ModuleEventsManager = new DefaultModuleEventsManager(redisCache);
const notificationManager: NotificationManager = new DefaultNotificationManager(redisCache);
const lrsManager: LRS = new LRSPlugin(new Endpoint({
  url: config.lrsUrl,
  headers: config.lrsHeaders
}));

const authorizationManager: AuthorizationManager = new DefaultAuthorizationManager(groupManager, userManager, roleManager);
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
// var allowCrossDomain = function(req: Request, res: Response, next: Function) {
//     let slashIndex = req.path.indexOf("/", 1);
//     if ((slashIndex != -1) && (slashIndex > 1)) {
//         let app = req.path.substr(1, slashIndex - 1);
//         let applicationParameters = lookupApplicationFromFile(app);
//         let origin: string = <string>req.headers["origin"];
//         if (applicationParameters && origin) {
//             var domains = applicationParameters.domains
//             var isGood = false;
//             for (var i = 0; i < domains.length; i++) {
//                 if (domains[i] == origin) {
//                     isGood = true;
//                     break
//                 }
//             }
//             if (isGood) {
//                 res.header('Access-Control-Allow-Origin', origin);
//                 res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//                 res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//             }
//         }
//     }
//     next();
// }

// expressApp.use(allowCrossDomain);

redisClient.on("error", function(error) {
  console.error(error);
});

expressApp.use(
  expressSession({
    store: new RedisSessionStore({ client: redisClient }),
    secret: config.sessionSecret,
    cookie: {
      secure: config.useSSL,
      httpOnly: true,
      maxAge: config.sessionTTL,
      sameSite: "strict"
    },
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

expressApp.get('/', function(req: Request, res: Response) {
  res.send("Hello World!").end();
});

expressApp.get('/login', function(req: Request, res: Response) {
  if (req.session) {
    if (!req.session.loggedIn) {
      authenticationManager.login(req, req.session, res);
    } else {
      res.status(200).end();
    }
  } else {
    res.status(503).end();
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
    if (req.session.loggedIn) {
      authenticationManager.logout(req.session, res);
    } else {
      res.status(200).end();
    }
  } else {
    res.status(503).end();
  }
});

expressApp.get('/refresh', function(req: Request, res: Response) {
  if (req.session) {
    if (req.session.loggedIn) {
      authenticationManager.refresh(req.session, res);
    } else {
      res.status(401).end();
    }
  } else {
    res.status(503).end();
  }
});

expressApp.post('/validate', function(req: Request, res: Response) {
  authenticationManager.validate(req.body.token, res);
});

expressApp.ws('/', function(ws: WebSocket, req: Request) {
  if (req.session) {
    if (req.session.loggedIn) {
      ws.on('message', function(msg: String) {
        console.log(msg, req.session?.test);
        if (req.session) {
          // if (!req.session.test) {
          //   req.session.test = 0;
          // }
          // req.session.test = req.session.test + 1;
          // req.session.save(function(err) {
          //   console.log(err);
          // });
        }
      });
      ws.send("ping");
    } else {
      ws.terminate();
    }
  }
});

expressApp.ws('/validmessage', function(ws: WebSocket, req: Request) {
  ws.on('message', function(msg) {
    if (req.session) {
      //TODO: Validate & Authorize
      if (typeof msg === 'string') {
        console.log(req.session.activeTokens.id_token);
        let payload: any;
        try {
          payload = JSON.parse(msg);
          validationManager.validate(payload)
          // if (!validationManager.validate(payload)) {
          //   ws.send("Invalid Message");
          //   return;
          // }
        } catch (e) {
          ws.send("Invalid Message");
          return;
        }

        authorizationManager.authorized("",
          payload,
          () => {
            console.log("test");
          },
          (err: any) => {
            ws.send("Invalid Message");
          });
      }
    } else {
      ws.terminate();
    }
  });
});

expressApp.ws('/message', function(ws: WebSocket, req: Request) {
  ws.on('message', function(msg) {
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
          userProfile: { identity: 'test account' } as any,
          payload: payload
        });

        messageQueue.createOutgoingQueue(req.session.id, ws, function(success: boolean) {
          //TODO
        });
        messageQueue.enqueueIncomingMessage(serviceMessage, function(success: boolean) {
          //TODO
        });
      }
    } else {
      ws.terminate();
    }
  });

  ws.on('close', function() {
    if (req.session) {
      messageQueue.removeOutgoingQueue(req.session.id);
    }
  })
});

httpsServer.listen(config.port, function() {
  console.log(`listening on port ${config.port}`);
});
