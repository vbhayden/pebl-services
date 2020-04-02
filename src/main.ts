import * as bodyParser from "body-parser";

import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

import { Request, Response } from 'express';
import * as WebSocket from 'ws';

let express = require('express');

let expressApp = express();

if (process.argv.length < 3) {
    console.log("command should include a path to the server configuration json");
    console.log("node <pathToScript> <pathToConfigurationJson>");
    process.exit();
}

const config: { [key: string]: any } = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

let privKey
let cert
let credentials: { [key: string]: any } = {}
let httpsServer

if (config.useSSL) {
    privKey = fs.readFileSync(config.privateKeyPath, "utf8");
    cert = fs.readFileSync(config.certificatePath, "utf8");

    credentials = {
        serverName: config.serverName,
        key: privKey,
        cert: cert
    }

    httpsServer = https.createServer(credentials, expressApp);
} else {
    httpsServer = http.createServer(expressApp);
}

expressApp = require('express-ws')(expressApp, httpsServer).app;

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

expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(bodyParser.json());

expressApp.use(function(req: Request, res: Response, next: Function) {
    console.log('middleware');
    console.log(res.charset);
    return next();
});

expressApp.get('/', function(req: Request, res: Response) {
    console.log('get route', req.originalUrl);
    res.end();
});

expressApp.ws('/echo', function(ws: WebSocket, req: Request) {
    ws.on('message', function(msg: String) {
        console.log(msg);
    });
    console.log('socket');
    ws.send("ping")
});

httpsServer.listen(config.port, function() {
    console.log(`listening on port ${config.port}`);
});
