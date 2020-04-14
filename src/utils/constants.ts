export const NAMESPACE_USER_MESSAGES = "user-";
export const PREFIX_PEBL_THREAD = "peblThread://";
export const PREFIX_PEBL = "pebl://";
export const PREFIX_PEBL_EXTENSION = "https://www.peblproject.com/definitions.html#";

// export const USER_PREFIX = "user-";
// export const GROUP_PREFIX = "group-";
// export const PEBL_THREAD_USER_PREFIX = "peblThread://" + USER_PREFIX;
// export const PEBL_THREAD_GROUP_PREFIX = "peblThread://" + GROUP_PREFIX;

// const competenciesKey = 'competencies';

export const SET_ALL_GROUPS = "groups:all";
export const SET_ALL_ROLES = "roles:all";
export const SET_ALL_USERS = "users:all";
export const SET_ALL_USER_ROLES = "userRoles:all"

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
export const KEY_REFERENCES = 'references';
export const KEY_ACTIONS = 'actions';
export const KEY_SESSIONS = 'sessions';
export const KEY_ROLES = 'roles';
export const KEY_GROUPS = 'groups';
export const KEY_USERS = 'users';

export const LRS_SYNC_TIMEOUT = 60000;
export const QUEUE_CLEANUP_TIMEOUT = 3600000;
export const JOB_BUFFER_TIMEOUT = 30000;

export const LRS_SYNC_LIMIT = 500;


// Store ids

// user
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

export function generateUserReferencesKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_REFERENCES;
}

export function generateUserActionsKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_ACTIONS;
}

export function generateUserSessionsKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_SESSIONS;
}

export function generateUserToGroupMembershipKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_GROUPS;
}

export function generateUserToRolesKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_ROLES;
}


//groups
export function generateGroupToUserMembersKey(groupId: string): string {
  return 'group:' + groupId + ':user:membership';
}

export function generateGroupToGroupMembersKey(groupId: string): string {
  return 'group:' + groupId + ':group:membership';
}

export function generateGroupToGroupMembershipKey(groupId: string): string {
  return 'group:' + groupId + ':' + KEY_GROUPS;
}

// Type ids

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

export function generateReferencesKey(id: string): string {
  return 'reference:' + id;
}

export function generateActionsKey(id: string): string {
  return 'action:' + id;
}

export function generateSessionsKey(id: string): string {
  return 'session:' + id;
}
