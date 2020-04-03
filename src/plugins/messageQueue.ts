import { MessageQueue, LRS, SessionDataCache } from '../adapters';
import { ServiceMessage, XApiQuery, XApiStatement, Activity } from '../models';

export class MessageQueuePlugin implements MessageQueue {
	private LRSPlugin: LRS;
	private SessionCachePlugin: SessionDataCache;

	constructor(LRSPlugin: LRS, SessionCachePlugin: SessionDataCache) {
		this.LRSPlugin = LRSPlugin;
		this.SessionCachePlugin = SessionCachePlugin;
	}


	dispatchMessage(message: ServiceMessage): void {
		// TODO
		let target = this.determineDispatchTarget(message);
		if (target === 'lrs') { //TODO: use some constant
			this.dispatchToLrs(message);
		} else if (target === 'client') {
			this.dispatchToClient(message);
		} else if (target === 'cache') {
			this.dispatchToCache(message);
		} else if (target === 'database') {
			this.dispatchToDatabase(message);
		}
	}

	determineDispatchTarget(message: ServiceMessage): string {
		// TODO
		//Return some constant string representing the target
		return 'lrs';
	}

	dispatchToLrs(message: ServiceMessage): void {
		//TODO: standardize requestTypes
		if (message.requestType === 'getStatements') {
			this.LRSPlugin.getStatements(this.constructXApiQuery(message), function(stmts) {
				// TODO: do something with the result
			});
		} else if (message.requestType === 'storeStatements') {
			//TODO: get the statements out of the message
			let stmts = [] as XApiStatement[];
			this.LRSPlugin.storeStatements(stmts);
		} else if (message.requestType === 'voidStatements') {
			//TODO: get the statements out of the message
			let stmts = [] as XApiStatement[];
			this.LRSPlugin.voidStatements(stmts);
		} else if (message.requestType === 'storeActivity') {
			//TODO: get the activity out of the message
			let activity = {} as Activity;
			this.LRSPlugin.storeActivity(activity, function(succeeded) {
				//TODO: Do something if failed or succeeded
			});
		} else if (message.requestType === 'getActivity') {
			//TODO: get the activity type out of the message
			let activityType = '';
			//TODO: get the activity id out of the message
			let activityId = '';

			this.LRSPlugin.getActivity(activityType, function(activity) {
				//TODO: do something with the result
				if (activity) {

				} else {

				}
			}, activityId); 
		}
	}

	dispatchToCache(message: ServiceMessage): void {
		//TODO
		if (message.requestType === 'getAnnotations') {
			this.SessionCachePlugin.getAnnotations(message.userProfile, function(annotations) {
				
			});
		}
	}

	dispatchToClient(message: ServiceMessage): void {
		//TODO

	}

	dispatchToDatabase(message: ServiceMessage): void {
		//TODO
	}


	private constructXApiQuery(message: ServiceMessage): XApiQuery {
		return new XApiQuery({
			//TODO get query data out of message
		});
	}

}