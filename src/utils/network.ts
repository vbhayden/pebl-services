import * as https from 'https';
import { Response } from 'express';
import { IncomingMessage } from 'http';
import { auditLogger } from '../main';
import { LogCategory, Severity } from './constants';

export function postData(
  host: string,
  path: string,
  headers: { [key: string]: any },
  rawData: string,
  successCallback?: (incomingData: string) => void,
  failCallback?: (e: Error | { [key: string]: any }) => void): void {

  let outgoingData = (rawData.startsWith("\"") && rawData.endsWith("\"")) ? rawData.substring(1, rawData.length - 1) : rawData;

  var postOptions = {
    host: host,
    protocol: "https:",
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  }

  Object.assign(postOptions.headers, headers); // Merge headers arg into postOptions
  var dataArr: string[] = [];
  const req = https.request(postOptions, function(resp: IncomingMessage) {
    resp.setEncoding("utf-8");

    resp.on("data", function(data) {
      dataArr.push(data);
    });

    resp.on("end", function() {
      let data = dataArr.join("");
      let statusCode = 200;
      if (resp.statusCode) {
        statusCode = resp.statusCode;
      }

      if (statusCode < 300) {
        auditLogger.report(LogCategory.NETWORK, Severity.INFO, "HTTPPOST", statusCode, host, path);
        if (successCallback) {
          successCallback(data);
        }
      } else {
        let message = "default bad post";
        if (resp.statusMessage) {
          message = resp.statusMessage;
        }
        auditLogger.report(LogCategory.NETWORK, Severity.ERROR, "HTTPPOST", statusCode, message, host, path, data);
        if (failCallback) {
          failCallback({
            error: message,
            message: data
          });
        }
      }
    });
  });

  req.on('error', function(e) {
    if (failCallback) {
      auditLogger.report(LogCategory.NETWORK, Severity.CRITICAL, "HTTPPOST", host, path, e);
      failCallback(e);
    }
  });
  req.write(outgoingData);
  req.end();
}

export function getData(
  host: string,
  path: string,
  headers: { [key: string]: any },
  successCallback?: (incomingData: string) => void,
  failCallback?: (e: Error | { [key: string]: any }) => void): void {

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
        let data = dataArr.join("");
        let statusCode = 200;
        if (resp.statusCode) {
          statusCode = resp.statusCode;
        }

        if (statusCode < 300) {
          auditLogger.report(LogCategory.NETWORK, Severity.INFO, "HTTPGET", statusCode, host, path)
          if (successCallback) {
            successCallback(data);
          }
        } else {
          let statusMessage = "HTTP GET errored";
          if (resp.statusMessage) {
            statusMessage = resp.statusMessage;
          }
          auditLogger.report(LogCategory.NETWORK, Severity.ERROR, "HTTPGET", statusCode, statusMessage, host, path, data)
          if (failCallback) {
            failCallback({
              error: statusMessage,
              message: data
            });
          }
        }
      });
    });
  req.on('error', function(e) {
    if (failCallback) {
      auditLogger.report(LogCategory.NETWORK, Severity.CRITICAL, "HTTPGET", host, path, e);
      failCallback(e);
    }
  });
}

export function deleteData(
  host: string,
  path: string,
  headers: { [key: string]: any },
  successCallback?: (incomingData: string) => void,
  failCallback?: (e: Error | { [key: string]: any }) => void): void {

  var dataArr: string[] = [];
  const req = https.request(
    <any>{
      host: host,
      path: path,
      protocol: "https:",
      port: 443,
      method: "DELETE",
      headers: headers
    },
    function(resp: IncomingMessage) {
      resp.setEncoding("utf-8");
      resp.on("data", function(data) {
        dataArr.push(data);
      });
      resp.on("end", function() {
        let data = dataArr.join("");
        let statusCode = 200;
        if (resp.statusCode) {
          statusCode = resp.statusCode;
        }

        if (statusCode < 300) {
          auditLogger.report(LogCategory.NETWORK, Severity.INFO, "HTTPDELETE", statusCode, host, path)
          if (successCallback) {
            successCallback(data);
          }
        } else {
          let statusMessage = "HTTP DELETE errored";
          if (resp.statusMessage) {
            statusMessage = resp.statusMessage;
          }
          auditLogger.report(LogCategory.NETWORK, Severity.ERROR, "HTTPDELETE", statusCode, statusMessage, host, path, data)
          if (failCallback) {
            failCallback({
              error: statusMessage,
              message: data
            });
          }
        }
      });
    });
  req.on('error', function(e) {
    if (failCallback) {
      auditLogger.report(LogCategory.NETWORK, Severity.CRITICAL, "HTTPDELETE", host, path, e);
      failCallback(e);
    }
  });
}

export function validateAndRedirectUrl(validRedirectDomainLookup: { [key: string]: boolean },
  session: Express.Session,
  res: Response,
  url?: string): void {

  if (url) {
    try {
      let origin = new URL(url).hostname;
      if (validRedirectDomainLookup[origin]) {
        auditLogger.report(LogCategory.AUTH, Severity.INFO, "RedirectingURL", session.id, url);
        res.redirect(url);
      }
    } catch (e) {
      auditLogger.report(LogCategory.AUTH, Severity.CRITICAL, "RedirectingURLInvalid", session.id, url);
      res.status(400).end();
    }
  } else {
    res.redirect(session.redirectUrl);
  }
}
