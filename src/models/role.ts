export class Role {
  name: string;
  permissions: { [permission: string]: true };

  constructor(name: string, permissions: { [permission: string]: true }) {
    this.name = name;
    this.permissions = permissions;
  }

  static convert(data: string): Role {
    let payload = JSON.parse(data);
    return new Role(payload.name,
      payload.permissions);
  }
}
