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


export function generateUserAnnotationsKey(identity: string) {
  return 'user:' + identity + ':' + KEY_ANNOTATIONS
}

export function generateUserSharedAnnotationsKey(identity: string) {
  return 'user:' + identity + ':' + KEY_SHARED_ANNOTATIONS
}


// export function getUserKey(identity: string): string {
//   return + identity;
// }

export function generateAnnotationsKey(id: string): string {
  return 'annotation:' + id;
}

export function generateSharedAnnotationsKey(id: string): string {
  return 'sharedAnnotation:' + id;
}

