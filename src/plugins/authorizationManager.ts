import { GroupManager } from "../interfaces/groupManager";
import { UserManager } from "../interfaces/userManager";
import { RoleManager } from "../interfaces/roleManager";
import { PluginManager } from "../interfaces/pluginManager";
import { PermissionSet } from "../models/permission";
import { Group } from "../models/group";
import { Role } from "../models/role";


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

  assemblePermissionSet(identity: string, callback: (permissions: PermissionSet) => void): void {
    this.userManager.getUserRoles(identity, (roles: Role[]) => {
      this.groupManager.getUserGroups(identity, (groups: Group[]) => {
        let userPermissions: { [permission: string]: boolean } = {};
        let groupPermissions: { [groupName: string]: { [permission: string]: boolean } } = {};

        for (let role of roles) {
          for (let rolePermission in role.permissions) {
            userPermissions[rolePermission] = true;
          }
        }
        for (let group of groups) {
          this.roleManager.getGroupRoles(group.name, (roles: Role[]) => {

          });
        }



        callback(new PermissionSet(userPermissions, groupPermissions));
      });
    });
  }

  authorize(username: string,
    permissions: any,
    payload: { [key: string]: any }): boolean {

    let messageTemplate = this.pluginManager.getMessageTemplate(payload.verb);
    if (messageTemplate) {
      return messageTemplate.authorize(username, permissions, payload);
    }

    return false;
  }
}
