// const NAMESPACE_USER_MESSAGES = "user-";
const PREFIX_PEBL_THREAD = "peblThread://";
const PREFIX_PEBL = "pebl://";
const PREFIX_PEBL_EXTENSION = "https://www.peblproject.com/definitions.html#";

export class ServiceMessage {
	//TODO
}

export class UserProfile {
	readonly identity: string;
    readonly name: string;
    readonly homePage: string;
    readonly preferredName: string;
    readonly metadata?: { [key: string]: any };
    readonly endpoints: Endpoint[];
    readonly registryEndpoint?: Endpoint;
    readonly currentTeam?: string | null;
    readonly currentClass?: string | null;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly avatar?: string;
    readonly email?: string;
    readonly phoneNumber?: string;
    readonly streetAddress?: string;
    readonly city?: string;
    readonly state?: string;
    readonly zipCode?: string;
    readonly country?: string;

    constructor(raw: { [key: string]: any }) {
        this.identity = raw.identity;
        this.name = raw.name;
        this.homePage = raw.homePage;
        this.preferredName = raw.preferredName;
        if (raw.registryEndpoint)
            this.registryEndpoint = new Endpoint(raw.registryEndpoint);
        if (raw.currentTeam)
            this.currentTeam = raw.currentTeam;
        if (raw.currentClass)
            this.currentClass = raw.currentClass;
        this.endpoints = [];

        this.metadata = raw.metadata;

        if (raw.endpoints)
            for (let endpointObj of raw.endpoints)
                this.endpoints.push(new Endpoint(endpointObj));

        if (this.homePage == null)
            this.homePage = "acct:keycloak-server";

        if (raw.firstName)
            this.firstName = raw.firstName;
        if (raw.lastName)
            this.lastName = raw.lastName;
        if (raw.avatar)
            this.avatar = raw.avatar;
        if (raw.email)
            this.email = raw.email;
        if (raw.phoneNumber)
            this.phoneNumber = raw.phoneNumber;
        if (raw.streetAddress)
            this.streetAddress = raw.streetAddress;
        if (raw.city)
            this.city = raw.city;
        if (raw.state)
            this.state = raw.state;
        if (raw.zipCode)
            this.zipCode = raw.zipCode;
        if (raw.country)
            this.country = raw.country;
    }

    toObject(): { [key: string]: any } {
        let urls: { [key: string]: any } = {};
        for (let e of this.endpoints)
            urls[e.url] = e.toObject();
        let obj = {
            "identity": this.identity,
            "name": this.name,
            "homePage": this.homePage,
            "preferredName": this.preferredName,
            "lrsUrls": urls,
            "metadata": {},
            "registryEndpoint": this.registryEndpoint,
            "currentTeam": this.currentTeam,
            "currentClass": this.currentClass,
            "firstName": this.firstName,
            "lastName": this.lastName,
            "avatar": this.avatar,
            "email": this.email,
            "phoneNumber": this.phoneNumber,
            "streetAddress": this.streetAddress,
            "city": this.city,
            "state": this.state,
            "zipCode": this.zipCode,
            "country": this.country
        };
        if (this.metadata)
            obj.metadata = this.metadata;

        return obj;
    }
}

export class Profile {
    readonly id: string;
    readonly type: string;
    timestamp: Date;
    etag?: string;
    identity?: string;
    readonly isNew: boolean = false;
    dirtyEdits: { [key: string]: boolean };
    delete?: boolean;

    constructor(raw: { [key: string]: any }) {
        this.dirtyEdits = {};
        if (!raw.id) {
            /*!
              Excerpt from: Math.uuid.js (v1.4)
              http://www.broofa.com
              mailto:robert@broofa.com
              Copyright (c) 2010 Robert Kieffer
              Dual licensed under the MIT and GPL licenses.
            */
            this.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            this.isNew = true;
        } else {
            this.id = raw.id;
            this.isNew = false;
        }
        this.timestamp = (typeof (raw.timestamp) === "string") ? new Date(Date.parse(raw.timestamp)) : new Date();
        this.etag = raw.etag;
        this.type = raw.type;
        this.delete = raw.delete;
    }

    static is(raw: { [key: string]: any }): boolean {
        return (raw.id && raw.type) != null;
    }

    clearDirtyEdits(): void {
        this.dirtyEdits = {};
    }

    toTransportFormat(): { [key: string]: any } {
        return {
            type: this.type,
            timestamp: this.timestamp ? this.timestamp.toISOString() : (new Date()).toISOString(),
            id: this.id
        }
    };

    static merge(oldProfile: any, newProfile: any): Profile {
        let mergedProfile = {} as any;
        let oldKeys = Object.keys(oldProfile);
        let newKeys = Object.keys(newProfile);

        for (let key of oldKeys) {
            mergedProfile[key] = oldProfile[key];
        }

        for (let key of newKeys) {
            // Null properties were set for a reason and should not be changed.
            if (mergedProfile[key] == null) {
                // Leave it
            } else {
                mergedProfile[key] = newProfile[key];
            }
        }

        // If either is flagged for deletion, that should not be changed.
        if ((oldProfile.delete && oldProfile.delete == true) || (newProfile.delete && newProfile.delete == true)) {
            mergedProfile.delete = true;
        }

        // If either is flagged as completed, that should not be changed.
        if ((oldProfile.completed && oldProfile.completed == true) || (newProfile.completed && newProfile.completed == true)) {
            mergedProfile.completed = true;
        }

        return mergedProfile as Profile;
    }
}

export class XApiStatement {
	identity?: string;
    readonly id: string;
    readonly "object": { [key: string]: any };
    readonly actor: { [key: string]: any };
    readonly verb: { [key: string]: any };
    readonly context: { [key: string]: any };
    readonly result: { [key: string]: any };
    readonly attachments: { [key: string]: any }[];
    readonly stored: string;
    readonly timestamp: string;

    constructor(raw: { [key: string]: any }) {
        this.id = raw.id;
        this.actor = raw.actor;
        this.verb = raw.verb;
        this.context = raw.context;
        this.stored = raw.stored;
        this.timestamp = raw.timestamp;
        this.result = raw.result;
        this["object"] = raw.object;
        this.attachments = raw.attachments;
    }

    toXAPI(): XApiStatement {
        return new XApiStatement(this);
    }

    getActorId(): string {
        return this.actor.mbox || this.actor.openid ||
            (this.actor.account && this.actor.account.name);
    }

    static is(x: any): boolean {
        if (x.verb)
            return true;
        else
            return false;
    }
}

export class XApiQuery {
    statementId?: string;
    voidedStatementId?: string;
	agent?: string;
    verb?: string;
    activity?: string;
    registration?: string;
    related_activities?: boolean;
    related_agents?: boolean;
    since?: string;
    until?: string;
    limit?: number;
    format?: string;
    attachments?: boolean;
    ascending?: boolean;

    constructor(raw: { [key: string]: any }) {
        this.statementId = raw.statementId;
        this.voidedStatementId = raw.voidedStatementId;
        this.agent = raw.agent;
        this.verb = raw.verb;
        this.activity = raw.activity;
        this.registration = raw.registration;
        this.related_activities = raw.related_activities;
        this.related_agents = raw.related_agents;
        this.since = raw.since;
        this.until = raw.until;
        this.limit = raw.limit;
        this.format = raw.format;
        this.attachments = raw.attachments;
        this.ascending = raw.ascending;
    }

    toQueryString(): string {
        let self = this;
        let queryString = Object.keys(this).reduce(function(result: string[], key) {
            if ((<any>self)[key] !== undefined) {
                result.push(key + '=' + (<any>self)[key]);
            }
            return result;
        }, []).join('&');
        return queryString;
    }
}

export class Annotation extends XApiStatement {
	readonly book: string;
    readonly type: string;
    readonly cfi: string;
    readonly idRef: string;
    readonly title: string;
    readonly style: string;
    readonly text?: string;
    readonly owner: string;

    constructor(raw: { [key: string]: any }) {
        super(raw);

        this.title = this.object.definition.name && this.object.definition.name["en-US"];
        this.text = this.object.definition.description && this.object.definition.description["en-US"];

        this.book = this.object.id;
        if (this.book.indexOf(PREFIX_PEBL) != -1)
            this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL) + PREFIX_PEBL.length);
        else if (this.book.indexOf(PREFIX_PEBL_THREAD) != -1)
            this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL_THREAD) + PREFIX_PEBL_THREAD.length);

        this.owner = this.getActorId();

        let extensions = this.object.definition.extensions;

        this.type = extensions[PREFIX_PEBL_EXTENSION + "type"];
        this.cfi = extensions[PREFIX_PEBL_EXTENSION + "cfi"];
        this.idRef = extensions[PREFIX_PEBL_EXTENSION + "idRef"];
        this.style = extensions[PREFIX_PEBL_EXTENSION + "style"];
    }

    static is(x: XApiStatement): boolean {
        let verb = x.verb.display["en-US"];
        return (verb == "commented") || (verb == "bookmarked") || (verb == "annotated");
    }
}

export class SharedAnnotation extends Annotation {
	    constructor(raw: { [key: string]: any }) {
        super(raw);
    }

    static is(x: XApiStatement): boolean {
        let verb = x.verb.display["en-US"];
        return (verb == "shared");
    }
}

export class Voided extends XApiStatement {
	readonly thread: string;
    readonly target: string;

    constructor(raw: { [key: string]: any }) {
        super(raw);
        this.thread = this.context.contextActivities.parent[0].id;
        if (this.thread.indexOf(PREFIX_PEBL_THREAD) != -1)
            this.thread = this.thread.substring(PREFIX_PEBL_THREAD.length);

        this.target = this.object.id;
    }

    static is(x: XApiStatement): boolean {
        let verb = x.verb.display["en-US"];
        return (verb == "voided");
    }
}

export class Competency {
	//TODO
}

export class Message {
	//TODO
}

export class Activity {
	readonly id: string;
    readonly type: string;
    timestamp: Date;
    etag?: string;
    identity?: string;
    readonly isNew: boolean = false;
    dirtyEdits: { [key: string]: boolean };
    delete?: boolean;

    constructor(raw: { [key: string]: any }) {
        this.dirtyEdits = {};
        if (!raw.id) {
            /*!
              Excerpt from: Math.uuid.js (v1.4)
              http://www.broofa.com
              mailto:robert@broofa.com
              Copyright (c) 2010 Robert Kieffer
              Dual licensed under the MIT and GPL licenses.
            */
            this.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            this.isNew = true;
        } else {
            this.id = raw.id;
            this.isNew = false;
        }
        this.timestamp = (typeof (raw.timestamp) === "string") ? new Date(Date.parse(raw.timestamp)) : new Date();
        this.etag = raw.etag;
        this.type = raw.type;
        this.delete = raw.delete;
    }

    static is(raw: { [key: string]: any }): boolean {
        return (raw.id && raw.type) != null;
    }

    clearDirtyEdits(): void {
        this.dirtyEdits = {};
    }

    toTransportFormat(): { [key: string]: any } {
        return {
            type: this.type,
            timestamp: this.timestamp ? this.timestamp.toISOString() : (new Date()).toISOString(),
            id: this.id
        }
    };

    static merge(oldActivity: any, newActivity: any): Activity {
        let mergedActivity = {} as any;
        let oldKeys = Object.keys(oldActivity);
        let newKeys = Object.keys(newActivity);

        for (let key of oldKeys) {
            mergedActivity[key] = oldActivity[key];
        }

        for (let key of newKeys) {
            // Null properties were set for a reason and should not be changed.
            if (mergedActivity[key] == null) {
                // Leave it
            } else {
                mergedActivity[key] = newActivity[key];
            }
        }

        // If either is flagged for deletion, that should not be changed.
        if ((oldActivity.delete && oldActivity.delete == true) || (newActivity.delete && newActivity.delete == true)) {
            mergedActivity.delete = true;
        }

        // If either is flagged as completed, that should not be changed.
        if ((oldActivity.completed && oldActivity.completed == true) || (newActivity.completed && newActivity.completed == true)) {
            mergedActivity.completed = true;
        }

        return mergedActivity as Activity;
    }
}

export class Endpoint {
    readonly url: string;
    readonly headers: { [key: string]: any };
    readonly username: string;
    readonly password: string;
    readonly token: string;
    readonly lastSyncedThreads: { [key: string]: Date }
    readonly lastSyncedBooksMine: { [key: string]: Date }
    readonly lastSyncedBooksShared: { [key: string]: Date }
    readonly lastSyncedActivityEvents: { [key: string]: Date }
    readonly lastSyncedModules: { [key: string]: Date }

    constructor(raw: { [key: string]: any }) {
        this.url = raw.url;
        this.headers = raw.headers;
        this.username = raw.username;
        this.password = raw.password;
        this.token = raw.token;

        if (!this.token) {
            this.token = btoa(this.username + ":" + this.password);
        }

        this.lastSyncedBooksMine = {};
        this.lastSyncedBooksShared = {};
        this.lastSyncedThreads = {};
        this.lastSyncedActivityEvents = {};
        this.lastSyncedModules = {};
    }

    toObject(urlPrefix: string = ""): { [key: string]: any } {
        return {
            url: this.url,
            headers: this.headers,
            username: this.username,
            password: this.password,
            token: this.token,
            lastSyncedThreads: this.lastSyncedThreads,
            lastSyncedBooksMine: this.lastSyncedBooksMine,
            lastSyncedBooksShared: this.lastSyncedBooksMine,
            lastSyncedActivityEvents: this.lastSyncedActivityEvents,
            lastSyncedModules: this.lastSyncedModules
        };
    }
}