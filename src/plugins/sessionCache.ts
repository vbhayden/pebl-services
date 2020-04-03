import { SessionDataCache } from '../adapters';
import { RedisClient } from 'redis';
import { UserProfile, Annotation, SharedAnnotation, XApiStatement, Activity, ModuleEvent, Message, ProgramAction, Asset, Membership } from '../models';

const annotationsKey = 'annotations';
const sharedAnnotationsKey = 'sharedAnnotations';
const eventsKey = 'events';
// const competenciesKey = 'competencies';
const messagesKey = 'messages';
const notificationsKey = 'notifications';
const activitiesKey = 'activities';
const activityEventsKey = 'activityEvents';
const assetsKey = 'assets';
const membershipsKey = 'memberships';
const moduleEventsKey = 'moduleEvents';


export class RedisSessionDataCache implements SessionDataCache {
	private redis: RedisClient;

	constructor(redisClient: RedisClient) {
		this.redis = redisClient;
	}

	getAnnotations(userProfile: UserProfile, callback: ((stmts: Annotation[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + annotationsKey, function(err, result) {
			if (err) {
				//TODO: Handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new Annotation(JSON.parse(x));
				}));
			}
		});
	}

	saveAnnotations(userProfile: UserProfile, stmts: Annotation[]): void {
		let arr = [];
		for (let stmt of stmts) {
			arr.push(this.getAnnotationsKey(stmt.id));
			arr.push(JSON.stringify(stmt));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + annotationsKey, arr);
	}

	removeAnnotation(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + annotationsKey, this.getAnnotationsKey(id), function(err, result) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	getSharedAnnotations(userProfile: UserProfile, callback: ((stmts: SharedAnnotation[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + sharedAnnotationsKey, function(err, result) {
			if (err) {
				//TODO: Handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new SharedAnnotation(JSON.parse(x));
				}));
			}
		})
	}

	saveSharedAnnotations(userProfile: UserProfile, stmts: SharedAnnotation[]): void {
		let arr = [];
		for (let stmt of stmts) {
			arr.push(this.getSharedAnnotationsKey(stmt.id));
			arr.push(JSON.stringify(stmt));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + sharedAnnotationsKey, arr);
	}

	removeSharedAnnotation(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + sharedAnnotationsKey, this.getSharedAnnotationsKey(id), function(err, result) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	getEvents(userProfile: UserProfile, callback: ((stmts: XApiStatement[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + eventsKey, function(err, result) {
			if (err) {
				//TODO: Handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new XApiStatement(JSON.parse(x));
				}));
			}
		});
	}

	saveEvents(userProfile: UserProfile, stmts: XApiStatement[]): void {
		let arr = [];
		for (let stmt of stmts) {
			arr.push(this.getEventsKey(stmt.id));
			arr.push(JSON.stringify(stmt));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + eventsKey, arr);
	}

	removeEvent(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + eventsKey, this.getEventsKey(id), function(err, res) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	// getCompetencies(userProfile: UserProfile, callback: ((competencies: Competency[]) => void)): void {
	// 	this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + competenciesKey, function(err, result) {
	// 		if (err) {
	// 			//TODO: handle error
	// 			callback([]);
	// 		} else {
	// 			callback(result.map(function(x) {
	// 				return new Competency(JSON.parse(x));
	// 			}));
	// 		}
	// 	})
	// }

	// saveCompetencies(userProfile: UserProfile, competencies: Competency[]): void {
	// 	let arr = [];
	// 	for (let competency of competencies) {
	// 		arr.push(this.getCompetenciesKey(competency.id));
	// 		arr.push(JSON.stringify(competency));
	// 	}
	// 	this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + competenciesKey, arr);
	// }

	// removeCompetency(userProfile: UserProfile, id: string): void {
	// 	this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + competenciesKey, this.getCompetenciesKey(id), function(err, res) {
	// 		if (err) {
	// 			//TODO
	// 		} else {
	// 			//TODO
	// 		}
	// 	});
	// }

	getMessages(userProfile: UserProfile, callback: ((messages: Message[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + messagesKey, function(err, result) {
			if (err) {
				//TODO: handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new Message(JSON.parse(x));
				}))
			}
		})
	}

	saveMessages(userProfile: UserProfile, messages: Message[]): void {
		let arr = [];
		for (let message of messages) {
			arr.push(this.getMessagesKey(message.id));
			arr.push(JSON.stringify(message));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + messagesKey, arr);
	}

	removeMessage(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + messagesKey, this.getMessagesKey(id), function(err, res) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	getNotifications(userProfile: UserProfile, callback: ((notifications: XApiStatement[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + notificationsKey, function(err, result) {
			if (err) {
				//TODO: handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new XApiStatement(JSON.parse(x));
				}));
			}
		})
	}

	saveNotifications(userProfile: UserProfile, notifications: XApiStatement[]): void {
		let arr = [];
		for (let notification of notifications) {
			arr.push(this.getNotificationsKey(notification.id));
			arr.push(JSON.stringify(notification));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + notificationsKey, arr);
	}

	removeNotification(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + notificationsKey, this.getNotificationsKey(id), function(err, res) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	getActivities(userProfile: UserProfile, callback: ((activity: Activity[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + activitiesKey, function(err, result) {
			if (err) {
				//TODO: handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new Activity(JSON.parse(x));
				}))
			}
		});
	}

	saveActivities(userProfile: UserProfile, activities: Activity[]): void {
		let arr = [];
		for (let activity of activities) {
			arr.push(this.getActivitiesKey(activity.id));
			arr.push(JSON.stringify(activity));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + activitiesKey, arr);
	}

	removeActivity(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + activitiesKey, this.getActivitiesKey(id), function(err, res) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	getActivityEvents(userProfile: UserProfile, callback: ((events: ProgramAction[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + activityEventsKey, function(err, result) {
			if (err) {
				//TODO: handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new ProgramAction(JSON.parse(x));
				}))
			}
		});
	}

	saveActivityEvents(userProfile: UserProfile, events: ProgramAction[]): void {
		let arr = [];
		for (let event of events) {
			arr.push(this.getActivityEventsKey(event.id));
			arr.push(JSON.stringify(event));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + activityEventsKey, arr);
	}

	removeActivityEvent(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + activityEventsKey, this.getActivityEventsKey(id), function(err, res) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	getAssets(userProfile: UserProfile, callback: ((assets: Asset[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + assetsKey, function(err, result) {
			if (err) {
				//TODO: handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new Asset(JSON.parse(x));
				}))
			}
		});
	}

	saveAssets(userProfile: UserProfile, assets: Asset[]): void {
		let arr = [];
		for (let asset of assets) {
			arr.push(this.getAssetsKey(asset.id));
			arr.push(JSON.stringify(asset));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + assetsKey, arr);
	}

	removeAsset(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + assetsKey, this.getAssetsKey(id), function(err, res) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	getMemberships(userProfile: UserProfile, callback: ((memberships: Membership[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + membershipsKey, function(err, result) {
			if (err) {
				//TODO: handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new Membership(JSON.parse(x));
				}))
			}
		});
	}

	saveMemberships(userProfile: UserProfile, memberships: Membership[]): void {
		let arr = [];
		for (let membership of memberships) {
			arr.push(this.getMembershipsKey(membership.id));
			arr.push(JSON.stringify(membership));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + membershipsKey, arr);
	}

	removeMebership(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + membershipsKey, this.getMembershipsKey(id), function(err, res) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	getModuleEvents(userProfile: UserProfile, callback: ((events: ModuleEvent[]) => void)): void {
		this.redis.hvals(this.getUserKey(userProfile.identity) + ':' + moduleEventsKey, function(err, result) {
			if (err) {
				//TODO: handle error
				callback([]);
			} else {
				callback(result.map(function(x) {
					return new ModuleEvent(JSON.parse(x));
				}))
			}
		});
	}

	saveModuleEvents(userProfile: UserProfile, events: ModuleEvent[]): void {
		let arr = [];
		for (let event of events) {
			arr.push(this.getModuleEventsKey(event.id));
			arr.push(JSON.stringify(event));
		}
		this.redis.hmset(this.getUserKey(userProfile.identity) + ':' + moduleEventsKey, arr);
	}

	removeModuleEvent(userProfile: UserProfile, id: string): void {
		this.redis.hdel(this.getUserKey(userProfile.identity) + ':' + moduleEventsKey, this.getModuleEventsKey(id), function(err, res) {
			if (err) {
				//TODO
			} else {
				//TODO
			}
		});
	}

	private getModuleEventsKey(id: string): string {
		return 'moduleEvent:' + id;
	}

	private getMembershipsKey(id: string): string {
		return 'membership:' + id;
	}

	private getAssetsKey(id: string): string {
		return 'asset:' + id;
	}

	private getActivityEventsKey(id: string): string {
		return 'activityEvent:' + id; 
	}

	private getActivitiesKey(id: string): string {
		return 'activity:' + id;
	}

	private getNotificationsKey(id: string): string {
		return 'notification:' + id;
	}

	private getMessagesKey(id: string): string {
		return 'message:' + id;
	}

	// private getCompetenciesKey(id: string): string {
	// 	return 'competency:' + id;
	// }

	private getEventsKey(id: string): string {
		return 'event:' + id;
	}

	private getSharedAnnotationsKey(id: string): string {
		return 'sharedAnnotation:' + id;
	}

	private getAnnotationsKey(id: string): string {
		return 'annotation:' + id;
	}

	private getUserKey(identity: string): string {
		return 'user:' + identity;
	}
}