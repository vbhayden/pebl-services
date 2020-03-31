import { Request, Response } from 'express';
import { IncomingMessage } from 'http';

import * as querystring from 'querystring';
import * as bodyParser from "body-parser";
import * as express from 'express';
import * as fs from 'fs';
import * as https from 'https';
// import * as http from 'http';
import * as url from 'url';
// import { randomBytes } from 'crypto';

var webserver = express();

webserver.use(bodyParser.urlencoded({ extended: false }));
webserver.use(bodyParser.json());

var allowCrossDomain = function(req: Request, res: Response, next: Function) {
    let slashIndex = req.path.indexOf("/", 1);
    if ((slashIndex != -1) && (slashIndex > 1)) {
        let app = req.path.substr(1, slashIndex - 1);

        let applicationParameters = lookupApplicationFromFile(app);
        let origin: string = <string>req.headers["origin"];

        if (applicationParameters && origin) {
            var domains = applicationParameters.domains
            var isGood = false;
            for (var i = 0; i < domains.length; i++) {
                if (domains[i] == origin) {
                    isGood = true;
                    break
                }
            }

            if (isGood) {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            }
        }
    }
    next();
}

webserver.use(allowCrossDomain);

const privKey = fs.readFileSync('/etc/letsencrypt/live/project.oauth.eduworks.com/privkey.pem', "utf8");
const cert = fs.readFileSync('/etc/letsencrypt/live/project.oauth.eduworks.com/cert.pem', "utf8");

const credentials = {
    serverName: "project.oauth.eduworks.com",
    // checkServerIdentity: () => { return null; },
    key: privKey,
    cert: cert // ,
    // ca: ca
}

function postData(
    host: string,
    path: string,
    rawData: string,
    successCallback?: (incomingData: string) => void,
    failCallback?: (e: Error) => void): void {

    let data = (rawData.startsWith("\"") && rawData.endsWith("\"")) ? rawData.substring(1, rawData.length - 1) : rawData;

    var postOptions = {
        host: host,
        protocol: "https:",
        port: 443,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
    }

    var dataArr: string[] = [];
    const req = https.request(postOptions, function(resp: IncomingMessage) {
        resp.setEncoding("utf-8");
        resp.on("data", function(data) {
            dataArr.push(data);
        });
        resp.on("end", function() {
            if (successCallback) {
                successCallback(dataArr.join(""));
            }
        });
    });
    req.on('error', function(e) {
        if (failCallback) {
            console.log(e);
            failCallback(e);
        }
    });
    req.write(data);
    req.end();
}

function getData(
    host: string,
    path: string,
    headers: { [key: string]: any },
    successCallback?: (incomingData: string) => void,
    failCallback?: (e: Error) => void): void {

    var dataArr: string[] = [];
    const req = https.get(
        <any>{
            host: host,
            path: path,
            protocol: "https:",
            port: 443,
            method: "GET",
            headers: headers
        },
        function(resp: IncomingMessage) {
            resp.setEncoding("utf-8");
            resp.on("data", function(data) {
                dataArr.push(data);
            });
            resp.on("end", function() {
                if (successCallback) {
                    successCallback(dataArr.join(""));
                }
            });
        });
    req.on('error', function(e) {
        if (failCallback) {
            console.log(e);
            failCallback(e);
        }
    });
}

function createAccessTokenParameters(
    redirectUri: string,
    code: string,
    clientId: string,
    clientSecret: string) {

    //switch over to urlencoded submission
    var params: { [key: string]: string } = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirectUri,
        "client_id": clientId,
        "client_secret": clientSecret
    };
    return querystring.stringify(params);
}

function lookupApplicationFromFile(appName: string): { [key: string]: any } {
    let data = JSON.parse(fs.readFileSync("oauthConfig.json", 'utf8'));

    return data[appName];
}

webserver.get('/oauth2/:appName/linkedin', function(req: Request, res: Response) {

    let app = req.params.appName;
    let authToken = req.query.authToken;

    let origin: string = <string>req.headers["origin"];

    let applicationParameters = lookupApplicationFromFile(app);

    if (applicationParameters && origin) {
        var domains = applicationParameters.domains
        var isGood = false;
        for (var i = 0; i < domains.length; i++) {
            if (domains[i] == origin) {
                isGood = true;
                break
            }
        }

        if (!isGood) {
            res.sendStatus(403);
            return;
        }

        let dataObj = createAccessTokenParameters(origin,
            authToken,
            applicationParameters.clientId,
            applicationParameters.clientSecret);

        postData("www.linkedin.com",
            "/oauth/v2/accessToken",
            JSON.stringify(dataObj),
            function(data) {
                if (isGood) {
                    if (origin) {
                        res.header("Access-Control-Allow-Origin", origin);
                    }
                }
                res.send(data);
            },
            function() {
                if (isGood) {
                    res.header("Access-Control-Allow-Origin", origin);
                }
                res.sendStatus(500);
            });
    } else {
        res.sendStatus(500);
        console.log("Couldn't find auth config in file.");
    }
});

webserver.get('/:appName/linkedin/me', function(req: Request, res: Response) {
    let app = req.params.appName;

    let urlQueryString = url.parse(req.url, true).search;

    let authToken: string | null = <string>req.headers["authorization"];
    let origin: string = <string>req.headers["origin"];

    let applicationParameters = lookupApplicationFromFile(app);

    if (applicationParameters && origin && authToken) {
        var domains = applicationParameters.domains
        var isGood = false;
        for (var i = 0; i < domains.length; i++) {
            if (domains[i] == origin) {
                isGood = true;
                break
            }
        }

        if (!isGood) {
            res.sendStatus(403);
            return;
        }

        getData('api.linkedin.com',
            '/v2/me' + urlQueryString,
            { Authorization: authToken },
            function(data) {
                if (isGood) {
                    res.header("Access-Control-Allow-Origin", origin);
                }
                res.send(data);
            },
            function() {
                if (isGood) {
                    res.header("Access-Control-Allow-Origin", origin);
                }
                res.sendStatus(500);
            });
    } else {
        res.sendStatus(500);
        console.log("Couldn't find auth config in file.");
    }
});

webserver.get('/:appName/linkedin/emailAddress', function(req: Request, res: Response) {
    let app = req.params.appName;

    let urlQueryString = url.parse(req.url, true).search;

    let authToken: string | null = <string>req.headers["authorization"];
    let origin: string = <string>req.headers["origin"];

    let applicationParameters = lookupApplicationFromFile(app);

    if (applicationParameters && origin && authToken) {
        var domains = applicationParameters.domains
        var isGood = false;
        for (var i = 0; i < domains.length; i++) {
            if (domains[i] == origin) {
                isGood = true;
                break
            }
        }

        if (!isGood) {
            res.sendStatus(403);
            return;
        }

        getData('api.linkedin.com',
            '/v2/emailAddress' + urlQueryString,
            { Authorization: authToken },
            function(data) {
                if (isGood) {
                    res.header("Access-Control-Allow-Origin", origin);
                }
                res.send(data);
            },
            function() {
                if (isGood) {
                    res.header("Access-Control-Allow-Origin", origin);
                }
                res.sendStatus(500);
            });
    } else {
        res.sendStatus(500);
        console.log("Couldn't find auth config in file.");
    }
});

const httpsServer = https.createServer(credentials, webserver);

httpsServer.listen(443, function() {
    console.log("listening on port 443");
});
