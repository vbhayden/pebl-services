import { LRS } from '../interfaces/lrsManager';
import * as network from '../utils/network';
import { Endpoint } from '../models/endpoint';
import { XApiStatement } from '../models/xapiStatement';
import { Voided } from '../models/voided';
import { XApiQuery } from '../models/xapiQuery';
import { Activity } from '../models/activity';
import { Profile } from '../models/profile';
import { PREFIX_PEBL_THREAD } from '../utils/constants';

export class LRSPlugin implements LRS {
  private endpoint: Endpoint;

  constructor(endpoint: Endpoint) {
    this.endpoint = endpoint;
  }

  private toVoidRecord(rec: XApiStatement): XApiStatement {
    let o = {
      "context": {
        "contextActivities": {
          "parent": [{
            "id": (rec.object) ? rec.object.id : "",
            "objectType": "Activity"
          }]
        }
      },
      "actor": rec.actor,
      "verb": {
        "display": {
          "en-US": "voided"
        },
        "id": "http://adlnet.gov/expapi/verbs/voided"
      },
      "object": {
        "id": rec.id,
        "objectType": "StatementRef"
      },
      "stored": rec.stored,
      "timestamp": rec.timestamp,
      "id": "v-" + rec.id
    };

    return new Voided(o);
  }

  storeStatements(stmts: XApiStatement[]): void {
    stmts.forEach(function(rec) {
      delete rec.identity;
    });

    let path = "data/xapi/statements";

    network.postData(this.endpoint.url, path, this.endpoint.headers, JSON.stringify(stmts));
  }

  voidStatements(stmts: XApiStatement[]): void {
    let self = this;
    let voidedStatements = stmts.map(function(stmt) {
      return self.toVoidRecord(stmt);
    });

    self.storeStatements(voidedStatements);
  }

  getStatements(xApiQuery: XApiQuery, callback: ((stmts: XApiStatement[]) => void)): void {
    let path = "data/xapi/statements?" + xApiQuery.toQueryString();

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

    let path = "data/xapi/activities/profile?activityId=" + encodeURIComponent(PREFIX_PEBL_THREAD + activity.type + "s") + "&profileId=" + activity.id;

    network.postData(this.endpoint.url, path, headers, jsObj, function() {
      callback(true);
    }, function() {
      callback(false);
    });
  }

  getActivity(activityType: string, callback: ((activity?: Activity) => void), activityId?: string): void {
    let path = "data/xapi/activities/profile?activityId=" + encodeURIComponent(PREFIX_PEBL_THREAD + activityType + "s") + (activityId ? ("&profileId=" + encodeURIComponent(activityId)) : '') + "&t=" + Date.now();

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
    let path = "data/xapi/activities/profile?activityId=" + encodeURIComponent(PREFIX_PEBL_THREAD + activity.type + "s") + "&profileId=" + activity.id;

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

    let path = "data/xapi/agents/profile?agent=" + encodeURIComponent(PREFIX_PEBL_THREAD + profile.type + "s") + "&profileId=" + profile.id;

    network.postData(this.endpoint.url, path, headers, jsObj, function() {
      callback(true);
    }, function() {
      callback(false);
    });
  }

  getProfile(profileType: string, callback: ((profile?: Profile) => void), profileId?: string, ): void {
    let path = "data/xapi/agents/profile?agent=" + encodeURIComponent(PREFIX_PEBL_THREAD + profileType + "s") + (profileId ? ("&profileId=" + encodeURIComponent(profileId)) : '') + "&t=" + Date.now();

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
    let path = "data/xapi/agents/profile?agent=" + encodeURIComponent(PREFIX_PEBL_THREAD + profile.type + "s") + "&profileId=" + profile.id;

    network.deleteData(this.endpoint.url, path, headers, function(incomingData) {
      callback(true);
    }, function(e) {
      callback(false);
    });
  }

}
