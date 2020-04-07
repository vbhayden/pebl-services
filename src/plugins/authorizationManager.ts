import { GroupManager } from "../interfaces/groupManager";
import { UserManager } from "../interfaces/userManager";
import { RoleManager } from "../interfaces/roleManager";


export class DefaultAuthorizationManager {

  private groupManager: GroupManager;
  private userManager: UserManager;
  private roleManager: RoleManager;

  constructor(groupManager: GroupManager, userManager: UserManager, roleManager: RoleManager) {
    this.groupManager = groupManager;
    this.userManager = userManager;
    this.roleManager = roleManager;
  }

  authorized(message: { [key: string]: any },
    successCallback: () => void,
    failureCallback: (err: string) => void): void {

    console.log(this.groupManager);
    console.log(this.userManager);
    console.log(this.roleManager);

  }
}
