import {LRS} from '../adapters';
import {XApiStatement, Endpoint, Voided, Activity} from '../models';

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
		let xhr = new XMLHttpRequest();

        xhr.addEventListener("load", function() {
            // callback(true);
        });

        xhr.addEventListener("error", function() {
            // callback(false);
        });

        xhr.open("POST", this.endpoint.url + "data/xapi/statements");
        xhr.setRequestHeader("Authorization", "Basic " + this.endpoint.token);
        xhr.setRequestHeader("X-Experience-API-Version", "1.0.3");
        xhr.setRequestHeader("Content-Type", "application/json");

        stmts.forEach(function(rec) {
            delete rec.identity;
        })

        xhr.send(JSON.stringify(stmts));
	}

	voidStatements(stmts: XApiStatement[]): void {
		let self = this;
		let voidedStatements = stmts.map(function(stmt) {
			return self.toVoidRecord(stmt);
		});

		self.storeStatements(voidedStatements);
	}

	getStatements(): XApiStatement[] {
		// TODO
	}

	storeActivity(activity: Activity, callback: ((success: boolean) => void)): void {
        let xhr = new XMLHttpRequest();
        let self = this;

        let jsObj: (string | null) = JSON.stringify(activity.toTransportFormat());

        xhr.addEventListener("load", function() {
            if (xhr.status === 412) {
                // There is a newer version on the server
                callback(false);
                //TODO: Should this callback with the status code?
            } else {
                activity.clearDirtyEdits();
                callback(true);
            }
        });

        xhr.addEventListener("error", function() {
            callback(false);
        });

        xhr.open("POST", self.endpoint.url + "data/xapi/activities/profile?activityId=" + encodeURIComponent(PEBL_THREAD_PREFIX + activity.type + "s") + "&profileId=" + activity.id, true);

        if (activity.etag) {
            xhr.setRequestHeader("If-Match", activity.etag);
        }
        xhr.setRequestHeader("X-Experience-API-Version", "1.0.3");
        xhr.setRequestHeader("Authorization", "Basic " + self.endpoint.token);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.send(jsObj);
    }

    getActivity(activityType: string, callback: ((activity?: Activity) => void), activityId?: string): void {
        let self = this;
        let presence = new XMLHttpRequest();

        presence.addEventListener("load", function() {
            if ((presence.status >= 200) && (presence.status <= 209)) {
                let jsonObj = JSON.parse(presence.responseText);
                callback(new Activity(jsonObj))
            } else {
                callback();
            }
        });

        presence.addEventListener("error", function() {
            if (callback) {
                callback();
            }
        });

        presence.open("GET", self.endpoint.url + "data/xapi/activities/profile?activityId=" + encodeURIComponent(PEBL_THREAD_PREFIX + activityType + "s") + (activityId ? ("&profileId=" + encodeURIComponent(activityId)) : '') + "&t=" + Date.now(), true);
        presence.setRequestHeader("X-Experience-API-Version", "1.0.3");
        presence.setRequestHeader("Authorization", "Basic " + self.endpoint.token);

        presence.send();
    }

    removeActivity(activity: Activity, callback: ((success: boolean) => void)): void {
        let xhr = new XMLHttpRequest();
        let self = this;

        xhr.addEventListener("load", function() {
            if (xhr.status === 412) {
                //TODO: callback with status code?
                callback(false);
            } else {
                callback(true);
            }
        });

        xhr.addEventListener("error", function() {
            callback(false);
        });

        xhr.open("DELETE", self.endpoint.url + "data/xapi/activities/profile?activityId=" + encodeURIComponent(PEBL_THREAD_PREFIX + activity.type + "s") + "&profileId=" + activity.id, true);


        //TODO: Is this necessary? If deleting an activity, does it matter if we have an old version of it?
        if (activity.etag) {
            xhr.setRequestHeader("If-Match", activity.etag);
        }
        xhr.setRequestHeader("X-Experience-API-Version", "1.0.3");
        xhr.setRequestHeader("Authorization", "Basic " + self.endpoint.token);

        xhr.send();
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