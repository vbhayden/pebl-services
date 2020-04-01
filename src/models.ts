const NAMESPACE_USER_MESSAGES = "user-";
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
	id: string;
	'@context': string;
	type: string;
	conformsTo: string;
	prefLabel: LanguageMap;
	definition: LanguageMap;
	seeAlso: string;
	versions: ProfileVersion[];
	author: Organization | Person;
	concepts: Concept[];
	templates: StatementTemplate[];
	patterns: Pattern[];
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
	//TODO
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
	//TODO
}

export class Endpoint {
	readonly url: string;
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
            url: urlPrefix + this.url,
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