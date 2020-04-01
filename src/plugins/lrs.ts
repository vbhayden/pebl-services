import {LRS} from '../adapters';
import {XApiStatement, Endpoint, Voided, Activity, XApiQuery, Profile} from '../models';
import * as network from '../utils/network';

//TODO: Move these consts somewhere else?
const USER_PREFIX = "user-";
const GROUP_PREFIX = "group-";
const PEBL_THREAD_PREFIX = "peblThread://";
const PEBL_THREAD_USER_PREFIX = "peblThread://" + USER_PREFIX;
const PEBL_THREAD_GROUP_PREFIX = "peblThread://" + GROUP_PREFIX;

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
		// TODO
	}

	storeActivity(activity: Activity, callback: ((success: boolean) => void)): void {
        let self = this;

        let jsObj = JSON.stringify(activity.toTransportFormat());

        let headers = JSON.parse(JSON.stringify(this.endpoint.headers));

        if (activity.etag) {
            Object.assign(headers, {"If-Match": activity.etag});
        }

        let path = "data/xapi/activities/profile?activityId=" + encodeURIComponent(PEBL_THREAD_PREFIX + activity.type + "s") + "&profileId=" + activity.id;

        network.postData(this.endpoint.url, path, headers, jsObj, function() {
            callback(true);
        }, function() {
            callback(false);
        });
    }

    getActivity(activityType: string, callback: ((activity?: Activity) => void), activityId?: string): void {
        let self = this;
        let path = "data/xapi/activities/profile?activityId=" + encodeURIComponent(PEBL_THREAD_PREFIX + activityType + "s") + (activityId ? ("&profileId=" + encodeURIComponent(activityId)) : '') + "&t=" + Date.now();

        network.getData(this.endpoint.url, path, this.endpoint.headers, function(incomingData) {
            let jsonObj = JSON.parse(incomingData);
            callback(new Activity(jsonObj));
        }, function(e) {
            callback();
        });
    }

    removeActivity(activity: Activity, callback: ((success: boolean) => void)): void {
        let self = this;

        let headers = JSON.parse(JSON.stringify(this.endpoint.headers));
        if (activity.etag) {
            Object.assign(headers, {"If-Match": activity.etag});
        }
        let path = "data/xapi/activities/profile?activityId=" + encodeURIComponent(PEBL_THREAD_PREFIX + activity.type + "s") + "&profileId=" + activity.id;

        network.deleteData(this.endpoint.url, path, headers, function(incomingData) {
            callback(true);
        }, function(e) {
            callback(false);
        });
    }

    storeProfile(profile: Profile, callback: ((success: boolean) => void)): void {
        //TODO
    }

    getProfile(profileId: string, callback: ((profile?: Profile) => void)): void {
        //TODO
    }

    removeProfile(profile: Profile, callback: ((success: boolean) => void)): void {
        //TODO
    }

}