export class Group {
  name?: string;
  description?: string;
  avatar?: string;

  constructor(name?: string, description?: string, avatar?: string) {
    this.name = name;
    this.description = description;
    this.avatar = avatar;
  }

  toString(): string {
    return JSON.stringify({
      name: this.name,
      description: this.description,
      avatar: this.avatar
    })
  }

  static convert(data: string): Group {
    let payload = JSON.parse(data);
    return new Group(payload.name,
      payload.description,
      payload.avatar);
  }
}
