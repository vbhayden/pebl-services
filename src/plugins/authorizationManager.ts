import { GroupManager } from "../interfaces/groupManager";
import { UserManager } from "../interfaces/userManager";
import { RoleManager } from "../interfaces/roleManager";
import { PluginManager } from "../interfaces/pluginManager";
import { PermissionSet } from "../models/permission";
import { Role } from "../models/role";
import { auditLogger } from "../main";
import { LogCategory, Severity } from "../utils/constants";

export class DefaultAuthorizationManager {

  private groupManager: GroupManager;
  private userManager: UserManager;
  private roleManager: RoleManager;
  private pluginManager: PluginManager;

  constructor(pluginManager: PluginManager, groupManager: GroupManager, userManager: UserManager, roleManager: RoleManager) {
    this.groupManager = groupManager;
    this.userManager = userManager;
    this.roleManager = roleManager;
    this.pluginManager = pluginManager;
  }

  assemblePermissionSet(identity: string, session: Express.Session, callback: () => void): void {
    this.userManager.getLastModifiedPermissions(identity, (lastModified: string) => {
      if ((session.lastModifiedPermissions === undefined) || (lastModified != session.lastModifiedPermissions)) {
        this.userManager.getUserRoles(identity, (roleIds: string[]) => {
          this.groupManager.getUsersGroups(identity, (groupIds: string[]) => {
            let userPermissions: { [permission: string]: boolean } = {};
            let groupPermissions: { [groupName: string]: { [permission: string]: boolean } } = {};

            this.roleManager.getMultiRole(roleIds, (roles: Role[]) => {
              for (let role of roles) {
                for (let permission of Object.keys(role.permissions)) {
                  userPermissions[permission] = true;
                }
              }

              //TODO: Do this the right way
              // Get permissions based on memberships object from keycloak attributes
              if (session.identity && session.identity.memberships) {
                for (let groupId in session.identity.memberships) {
                  if (!groupPermissions[groupId])
                    groupPermissions[groupId] = {};

                  if (session.identity.memberships[groupId] === 'learner')
                    this.setGroupPermissionsLearner(groupPermissions[groupId]);
                  else if (session.identity.memberships[groupId] === 'instructor')
                    this.setGroupPermissionsInstructor(groupPermissions[groupId]);
                  else if (session.identity.memberships[groupId] === 'admin')
                    this.setGroupPermissionsAdmin(groupPermissions[groupId]);
                }
              }

              //TODO implement nested group permission resolution
              let getGroupRoles = (groupIds: string[]) => {
                let groupId = groupIds.pop();
                if (groupId !== undefined) {
                  this.groupManager.getGroupMemberUser(groupId, identity, (roleIds: string[]) => {
                    this.roleManager.getMultiRole(roleIds, (roles: Role[]) => {
                      for (let role of roles) {
                        for (let permission of Object.keys(role.permissions)) {
                          if (groupId) {
                            groupPermissions[groupId][permission] = true;
                          }
                        }
                      }
                      getGroupRoles(groupIds);
                    });
                  });
                } else {
                  session.lastModifiedPermissions = lastModified;
                  session.permissions = new PermissionSet(userPermissions, groupPermissions);
                  auditLogger.report(LogCategory.AUTH, Severity.INFO, "AssembledPermissions", session.id, roleIds);
                  session.save(() => {
                    callback();
                  });
                }
              }

              getGroupRoles(groupIds);
            });
          });
        });
      } else {
        callback();
      }
    });
  }

  authorize(username: string,
    permissions: PermissionSet,
    payload: { [key: string]: any }): boolean {

    let messageTemplate = this.pluginManager.getMessageTemplate(payload.requestType);
    if (messageTemplate) {
      return messageTemplate.authorize(username, permissions, payload);
    }

    return false;
  }

  private setGroupPermissionsLearner(permissionsObj: { [key: string]: boolean }) {
    permissionsObj['getSharedAnnotations'] = true;
    permissionsObj['saveSharedAnnotations'] = true;

    permissionsObj['subscribeThread'] = true;
    permissionsObj['unsubscribeThread'] = true;
    permissionsObj['getThreadedMessages'] = true;
    permissionsObj['saveThreadedMessage'] = true;
  }

  private setGroupPermissionsInstructor(permissionsObj: { [key: string]: boolean }) {
    permissionsObj['getSharedAnnotations'] = true;
    permissionsObj['saveSharedAnnotations'] = true;
    permissionsObj['deleteSharedAnnotation'] = true;
    permissionsObj['pinSharedAnnotation'] = true;
    permissionsObj['unpinSharedAnnotation'] = true;


    permissionsObj['subscribeThread'] = true;
    permissionsObj['unsubscribeThread'] = true;
    permissionsObj['getThreadedMessages'] = true;
    permissionsObj['saveThreadedMessage'] = true;
    permissionsObj['deleteThreadedMessage'] = true;
    permissionsObj['pinThreadedMessage'] = true;
    permissionsObj['unpinThreadedMessage'] = true;

  }

  private setGroupPermissionsAdmin(permissionsObj: { [key: string]: boolean }) {
    permissionsObj['getSharedAnnotations'] = true;
    permissionsObj['saveSharedAnnotations'] = true;
    permissionsObj['deleteSharedAnnotation'] = true;
    permissionsObj['pinSharedAnnotation'] = true;
    permissionsObj['unpinSharedAnnotation'] = true;


    permissionsObj['subscribeThread'] = true;
    permissionsObj['unsubscribeThread'] = true;
    permissionsObj['getThreadedMessages'] = true;
    permissionsObj['saveThreadedMessage'] = true;
    permissionsObj['deleteThreadedMessage'] = true;
    permissionsObj['pinThreadedMessage'] = true;
    permissionsObj['unpinThreadedMessage'] = true;
  }
}
