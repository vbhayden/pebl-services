export class PermissionSet {

  user: { [permission: string]: boolean };
  group: { [groupName: string]: { [permission: string]: boolean } };

  constructor(user: { [permission: string]: boolean }, group: { [groupName: string]: { [permission: string]: boolean } }) {
    this.user = user;
    this.group = group;
  }
}
