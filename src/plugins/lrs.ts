import { LRS } from '../interfaces/lrsManager';
import * as network from '../utils/network';
import { Endpoint } from '../models/endpoint';
import { XApiStatement, Voided } from '../models/xapiStatement';
import { XApiQuery } from '../models/xapiQuery';
import { Activity } from '../models/activity';
import { Profile } from '../models/profile';
import { PREFIX_PEBL_THREAD } from '../utils/constants';

export class LRSPlugin implements LRS {
  private endpoint: Endpoint;

  constructor(endpoint: Endpoint) {
    this.endpoint = endpoint;
  }



  storeStatements(stmts: XApiStatement[], successCb: ((string: string) => void), failureCb: ((e: Error | { [key: string]: any }) => void)): void {
    stmts.forEach(function(rec) {
      delete rec.identity;
      rec = rec.toXAPI();
    });

    let path = "/data/xapi/statements";
    network.postData(this.endpoint.url, path, this.endpoint.headers, JSON.stringify(stmts), successCb, failureCb);
  }

  voidStatements(stmts: XApiStatement[]): Voided[] {
    let voidedStatements = stmts.map(function(stmt) {
      return stmt.toVoidRecord();
    });

    return voidedStatements;
  }

  parseStatements(strings: string[]): [XApiStatement[], Activity[], Profile[], { [key: string]: string }] {
    let statements = [] as XApiStatement[];
    let activities = [] as Activity[];
    let profiles = [] as Profile[];
    let lookup: { [key: string]: string } = {};
    for (let str of strings) {
      let obj = JSON.parse(str);
      if (XApiStatement.is(obj)) {
        let x = new XApiStatement(obj);
        statements.push(x);
        lookup[x.id] = str;
      } else if (Activity.is(obj)) {
        let a = new Activity(obj);
        activities.push(a);
        lookup[a.id] = str;
      } else if (Profile.is(obj)) {
        let p = new Profile(obj);
        profiles.push(p);
        lookup[p.id] = str;
      }
    }
    return [statements, activities, profiles, lookup];
  }

  getStatements(xApiQuery: XApiQuery, callback: ((stmts: XApiStatement[]) => void)): void {
    let path = "/data/xapi/statements?" + xApiQuery.toQueryString();

    network.getData(this.endpoint.url, path, this.endpoint.headers, function(incomingData) {
      //TODO: deal with "more" link in response
      callback(JSON.parse(incomingData).statements);
    }, function(e) {
      callback([]);
    });
  }

  storeActivity(activity: Activity, callback: ((success: boolean) => void)): void {
    let jsObj = JSON.stringify(activity.toTransportFormat());

    let headers = JSON.parse(JSON.stringify(this.endpoint.headers));

    if (activity.etag) {
      Object.assign(headers, { "If-Match": activity.etag });
    }

    let path = "/data/xapi/activities/profile?activityId=" + encodeURIComponent(PREFIX_PEBL_THREAD + activity.type + "s") + "&profileId=" + activity.id;

    network.postData(this.endpoint.url, path, headers, jsObj, function() {
      callback(true);
    }, function() {
      callback(false);
    });
  }

  getActivity(activityType: string, callback: ((activity?: Activity) => void), activityId?: string): void {
    let path = "/data/xapi/activities/profile?activityId=" + encodeURIComponent(PREFIX_PEBL_THREAD + activityType + "s") + (activityId ? ("&profileId=" + encodeURIComponent(activityId)) : '') + "&t=" + Date.now();

    network.getData(this.endpoint.url, path, this.endpoint.headers, function(incomingData) {
      let jsonObj = JSON.parse(incomingData);
      callback(new Activity(jsonObj));
    }, function(e) {
      callback();
    });
  }

  removeActivity(activity: Activity, callback: ((success: boolean) => void)): void {
    let headers = JSON.parse(JSON.stringify(this.endpoint.headers));
    if (activity.etag) {
      Object.assign(headers, { "If-Match": activity.etag });
    }
    let path = "/data/xapi/activities/profile?activityId=" + encodeURIComponent(PREFIX_PEBL_THREAD + activity.type + "s") + "&profileId=" + activity.id;

    network.deleteData(this.endpoint.url, path, headers, function(incomingData) {
      callback(true);
    }, function(e) {
      callback(false);
    });
  }

  storeProfile(profile: Profile, callback: ((success: boolean) => void)): void {
    let jsObj = JSON.stringify(profile.toTransportFormat());

    let headers = JSON.parse(JSON.stringify(this.endpoint.headers));

    if (profile.etag) {
      Object.assign(headers, { "If-Match": profile.etag });
    }

    let path = "/data/xapi/agents/profile?agent=" + encodeURIComponent(PREFIX_PEBL_THREAD + profile.type + "s") + "&profileId=" + profile.id;

    network.postData(this.endpoint.url, path, headers, jsObj, function() {
      callback(true);
    }, function() {
      callback(false);
    });
  }

  getProfile(profileType: string, callback: ((profile?: Profile) => void), profileId?: string, ): void {
    let path = "/data/xapi/agents/profile?agent=" + encodeURIComponent(PREFIX_PEBL_THREAD + profileType + "s") + (profileId ? ("&profileId=" + encodeURIComponent(profileId)) : '') + "&t=" + Date.now();

    network.getData(this.endpoint.url, path, this.endpoint.headers, function(incomingData) {
      let jsonObj = JSON.parse(incomingData);
      callback(new Profile(jsonObj));
    }, function(e) {
      callback();
    });
  }

  removeProfile(profile: Profile, callback: ((success: boolean) => void)): void {
    let headers = JSON.parse(JSON.stringify(this.endpoint.headers));
    if (profile.etag) {
      Object.assign(headers, { "If-Match": profile.etag });
    }
    let path = "/data/xapi/agents/profile?agent=" + encodeURIComponent(PREFIX_PEBL_THREAD + profile.type + "s") + "&profileId=" + profile.id;

    network.deleteData(this.endpoint.url, path, headers, function(incomingData) {
      callback(true);
    }, function(e) {
      callback(false);
    });
  }

}
