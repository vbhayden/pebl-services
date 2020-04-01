import * as bodyParser from "body-parser";

import * as fs from 'fs';
import * as https from 'https';

import { Request, Response } from 'express';
import * as WebSocket from 'ws';

let express = require('express');

let webserver = express();
webserver = require('express-ws')(webserver).app;

webserver.use(function(req: Request, res: Response, next: Function) {
    console.log('middleware');
    console.log(res);
    return next();
});

webserver.get('/', function(req: Request, res: Response) {
    console.log('get route', req);
    res.end();
});

webserver.ws('/', function(ws: WebSocket, req: Request) {
    ws.on('message', function(msg: String) {
        console.log(msg);
    });
    console.log('socket', req);
});

webserver.use(bodyParser.urlencoded({ extended: false }));
webserver.use(bodyParser.json());

if (process.argv.length < 3) {
    console.log("command should include a path to the server configuration json")
    console.log("node <script> <pathToConfigurationJson>")
}

const config: { [key: string]: any } = JSON.parse(fs.readFileSync('./serverConfig.json', "utf8"));
const privKey = fs.readFileSync(config.privateKeyPath, "utf8");
const cert = fs.readFileSync(config.certificatePath, "utf8");

const credentials = {
    serverName: config.serverName,
    key: privKey,
    cert: cert
}

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

// webserver.use(allowCrossDomain);

const httpsServer = https.createServer(credentials, webserver);

httpsServer.listen(config.port, function() {
    console.log(`listening on port ${config.port}`);
});
