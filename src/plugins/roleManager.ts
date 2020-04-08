import { PeBLPlugin } from "../models/peblPlugin";
import { RoleManager } from "../interfaces/roleManager";
import { Role } from "../models/role";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { MessageTemplate } from "../models/messageTemplate";

export class DefaultRoleManager extends PeBLPlugin implements RoleManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
    this.addMessageTemplate(new MessageTemplate("addRole",
      this.validateAddRole,
      (payload) => {
        this.addRole(payload.id, payload.name, payload.permissions);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteRole",
      this.validateDeleteRole,
      (payload) => {
        this.deleteRole(payload.id);
      }));

    this.addMessageTemplate(new MessageTemplate("updateRole",
      this.validateUpdateRole,
      (payload) => {
        this.updateRole(payload.id, payload.name, payload.permissions);
      }));

    this.addMessageTemplate(new MessageTemplate("getRoles",
      this.validateGetRoles,
      (payload) => {
        this.getRoles(payload.callback);
      }));
  }

  validateAddRole(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteRole(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateUpdateRole(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetRole(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetRoles(payload: { [key: string]: any }): boolean {
    return false;
  }


  //Add a role based on a set of permissions
  addRole(id: string, name: string, permissions: string[]): void {

  }

  //Remove a role    
  deleteRole(id: string): void {

  }

  //Updates the permission set and/or name of a role    
  updateRole(id: string, name?: string, permissions?: string[]): void {

  }

  //Get a role with the specified id
  getRole(id: string, callback: ((role: Role) => void)): void {

  }

  //Get all the roles in the system    
  getRoles(callback: ((roles: Role[]) => void)): void {

  }
}
