import { IncomingMessage } from 'http';
import * as https from 'https';

export function postData(
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

export function getData(
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
