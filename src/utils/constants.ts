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
export const SET_ALL_USERS_LAST_MODIFIED_PERMISSIONS = "users:lastModified:permissions";
export const SET_ALL_ACTIVE_JOBS = "activeJobs:all";
export const SET_ALL_JOBS = "jobs:all";

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
export const KEY_NAVIGATIONS = 'navigations';

export const LRS_SYNC_TIMEOUT = 30000;
export const QUEUE_CLEANUP_TIMEOUT = 3600000;
export const JOB_BUFFER_TIMEOUT = 30000;

export const LRS_SYNC_LIMIT = 500;


export const QUEUE_REALTIME_BROADCAST_PREFIX = "realtime:userid:";
export const QUEUE_OUTGOING_MESSAGE_PREFIX = 'rsmq:rt:';
export const QUEUE_JOBS = 'rsmq:rt:jobs';
export const QUEUE_INCOMING_MESSAGE = 'rsmq:rt:incomingMessages';
export const QUEUE_ACTIVE_JOBS = 'activeJobs';
export const QUEUE_ALL_USERS = "allUsers";

export const MESSAGE_QUEUE_JOBS = 'jobs';
export const MESSAGE_QUEUE_INCOMING_MESSAGES = 'incomingMessages';

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

export function generateRoleToUsersKey(roleId: string): string {
  return 'role:' + roleId + ':' + KEY_USERS;
}

export function generateUserNavigationsKey(identity: string): string {
  return 'user:' + identity + ':' + KEY_NAVIGATIONS;
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

export function generateNavigationsKey(id: string): string {
  return 'navigation:' + id;
}

export function generateBroadcastQueueForUserId(id: string): string {
  return QUEUE_REALTIME_BROADCAST_PREFIX + id;
}

export function generateOutgoingQueueForId(id: string): string {
  return QUEUE_OUTGOING_MESSAGE_PREFIX + id;
}

export function generateTimestampForUserId(id: string): string {
  return 'timestamp:messages:user:' + id;
}

export function generateTimestampForThread(thread: string): string {
  return 'timestamp:threads:' + thread;
}

export function generateThreadKey(thread: string): string {
  return 'threads:' + thread;
}

export function generateUserThreadsKey(id: string): string {
  return 'user:' + id + ':threads';
}

export function generateUserPrivateThreadsKey(id: string): string {
  return 'user:' + id + ':privateThreads';
}

export function generateUserGroupThreadsKey(id: string, groupId: string): string {
  return 'user:' + id + ':groupThreads:' + groupId;
}

export function generateSubscribedUsersKey(thread: string): string {
  return 'users:thread:' + thread;
}

export function generateTimestampForAnnotations(id: string): string {
  return 'timestamp:annotations:' + id;
}

export function generateTimestampForReference(id: string): string {
  return 'timestamp:references:' + id;
}

export function generateTimestampForNotification(id: string): string {
  return 'timestamp:notifications:' + id;
}


export enum Severity {
  EMERGENCY = 0, // system isn't working
  ALERT = 1, // system needs attention
  CRITICAL = 2, // code path has failed
  ERROR = 3, // code path has failed, but can recover
  WARNING = 4, // unusual conditions
  NOTICE = 5, // normal but unlikely
  INFO = 6, // normal
  DEBUG = 7 // extra information
}

export const SeverityToReadable = [
  "emergency",
  "alert",
  "critical",
  "error",
  "warning",
  "notice",
  "info",
  "debug"
];

export const severityEnums: Severity[] = [
  Severity.EMERGENCY,
  Severity.ALERT,
  Severity.CRITICAL,
  Severity.ERROR,
  Severity.WARNING,
  Severity.NOTICE,
  Severity.INFO,
  Severity.DEBUG
];

export enum LogCategory {
  SYSTEM = "sys",
  AUTH = "auth",
  MESSAGE = "msg",
  FILE_SYSTEM = "fs",
  NETWORK = "net",
  STORAGE = "stor",
  PLUGIN = "plug"
}

export const logCategoriesEnums: LogCategory[] = [
  LogCategory.SYSTEM,
  LogCategory.AUTH,
  LogCategory.MESSAGE,
  LogCategory.FILE_SYSTEM,
  LogCategory.NETWORK,
  LogCategory.STORAGE,
  LogCategory.SYSTEM,
  LogCategory.PLUGIN
];
