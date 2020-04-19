export class Activity {
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
      /*!
        Excerpt from: Math.uuid.js (v1.4)
        http://www.broofa.com
        mailto:robert@broofa.com
        Copyright (c) 2010 Robert Kieffer
        Dual licensed under the MIT and GPL licenses.
      */
      this.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
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

  static merge(oldActivity: any, newActivity: any): Activity {
    let mergedActivity = {} as any;
    let oldKeys = Object.keys(oldActivity);
    let newKeys = Object.keys(newActivity);

    for (let key of oldKeys) {
      mergedActivity[key] = oldActivity[key];
    }

    for (let key of newKeys) {
      // Null properties were set for a reason and should not be changed.
      if (mergedActivity[key] == null) {
        // Leave it
      } else {
        mergedActivity[key] = newActivity[key];
      }
    }

    // If either is flagged for deletion, that should not be changed.
    if ((oldActivity.delete && oldActivity.delete == true) || (newActivity.delete && newActivity.delete == true)) {
      mergedActivity.delete = true;
    }

    // If either is flagged as completed, that should not be changed.
    if ((oldActivity.completed && oldActivity.completed == true) || (newActivity.completed && newActivity.completed == true)) {
      mergedActivity.completed = true;
    }

    return mergedActivity as Activity;
  }
}
