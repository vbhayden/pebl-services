import { genUUID } from "../utils/utils";

export class Profile {
  readonly id: string;
  readonly type: string;
  timestamp: Date;
  etag?: string;
  identity?: string;
  readonly isNew: boolean = false;
  dirtyEdits: { [key: string]: boolean };
  delete?: boolean;

  constructor(raw: { [key: string]: any }) {
    this.dirtyEdits = {};
    if (!raw.id) {
      this.id = genUUID();
      this.isNew = true;
    } else {
      this.id = raw.id;
      this.isNew = false;
    }
    this.timestamp = (typeof (raw.timestamp) === "string") ? new Date(Date.parse(raw.timestamp)) : new Date();
    this.etag = raw.etag;
    this.type = raw.type;
    this.delete = raw.delete;
  }

  static is(raw: { [key: string]: any }): boolean {
    return (raw.id && raw.type) != null;
  }

  clearDirtyEdits(): void {
    this.dirtyEdits = {};
  }

  toTransportFormat(): { [key: string]: any } {
    return {
      type: this.type,
      timestamp: this.timestamp ? this.timestamp.toISOString() : (new Date()).toISOString(),
      id: this.id
    }
  };

  static merge(oldProfile: any, newProfile: any): Profile {
    let mergedProfile = {} as any;
    let oldKeys = Object.keys(oldProfile);
    let newKeys = Object.keys(newProfile);

    for (let key of oldKeys) {
      mergedProfile[key] = oldProfile[key];
    }

    for (let key of newKeys) {
      // Null properties were set for a reason and should not be changed.
      if (mergedProfile[key] == null) {
        // Leave it
      } else {
        mergedProfile[key] = newProfile[key];
      }
    }

    // If either is flagged for deletion, that should not be changed.
    if ((oldProfile.delete && oldProfile.delete == true) || (newProfile.delete && newProfile.delete == true)) {
      mergedProfile.delete = true;
    }

    // If either is flagged as completed, that should not be changed.
    if ((oldProfile.completed && oldProfile.completed == true) || (newProfile.completed && newProfile.completed == true)) {
      mergedProfile.completed = true;
    }

    return mergedProfile as Profile;
  }
}
