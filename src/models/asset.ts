export class Asset {
  //TODO
  readonly id: string;

  constructor(raw: { [key: string]: any }) {
    this.id = raw.id;
  }
}
