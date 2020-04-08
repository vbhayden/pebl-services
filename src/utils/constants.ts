export const NAMESPACE_USER_MESSAGES = "user-";
export const PREFIX_PEBL_THREAD = "peblThread://";
export const PREFIX_PEBL = "pebl://";
export const PREFIX_PEBL_EXTENSION = "https://www.peblproject.com/definitions.html#";

// export const USER_PREFIX = "user-";
// export const GROUP_PREFIX = "group-";
// export const PEBL_THREAD_USER_PREFIX = "peblThread://" + USER_PREFIX;
// export const PEBL_THREAD_GROUP_PREFIX = "peblThread://" + GROUP_PREFIX;

// const competenciesKey = 'competencies';

export const KEY_ANNOTATIONS = 'annotations';
export const KEY_SHARED_ANNOTATIONS = 'sharedAnnotations';
export const KEY_EVENTS = 'events';
export const KEY_MESSAGES = 'messages';
export const KEY_NOTIFICATIONS = 'notifications';
export const KEY_ACTIVITIES = 'activities';
export const KEY_ACTIVITY_EVENTS = 'activityEvents';
export const KEY_ASSETS = 'assets';
export const KEY_MEMBERSHIP = 'memberships';
export const KEY_MODULE_EVENTS = 'moduleEvents';

export const LRS_SYNC_TIMEOUT = 60000;
export const QUEUE_CLEANUP_TIMEOUT = 3600000;
export const JOB_BUFFER_TIMEOUT = 30000;

export const LRS_SYNC_LIMIT = 500;


export function generateUserAnnotationsKey(identity: string) {
  return 'user:' + identity + ':' + KEY_ANNOTATIONS;
}

export function generateUserSharedAnnotationsKey(identity: string) {
  return 'user:' + identity + ':' + KEY_SHARED_ANNOTATIONS;
}

export function generateUserEventsKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_EVENTS;
}

export function generateUserMessagesKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_MESSAGES;
}

export function generateUserNotificationsKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_NOTIFICATIONS;
}

export function generateUserActivitiesKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_ACTIVITIES;
}

export function generateUserActivityEventsKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_ACTIVITY_EVENTS;
}

export function generateUserModuleEventsKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_MODULE_EVENTS;
}

export function generateUserAssetKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_ASSETS;
}

export function generateUserMembershipKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_MEMBERSHIP;
}

export function generateAnnotationsKey(id: string): string {
  return 'annotation:' + id;
}

export function generateSharedAnnotationsKey(id: string): string {
  return 'sharedAnnotation:' + id;
}

export function generateEventsKey(id: string): string {
  return 'event:' + id;
}

export function generateMessagesKey(id: string): string {
  return 'message:' + id;
}

export function generateNotificationsKey(id: string): string {
  return 'notification:' + id;
}

export function generateActivitiesKey(id: string): string {
  return 'activity:' + id;
}

export function generateActivityEventsKey(id: string): string {
  return 'activityEvent:' + id;
}

export function generateModuleEventsKey(id: string): string {
  return 'moduleEvent:' + id;
}

export function generateAssetsKey(id: string): string {
  return 'asset:' + id;
}

export function generateMembershipsKey(id: string): string {
  return 'membership:' + id;
}
