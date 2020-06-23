import { XApiStatement, ActivityObject } from "./xapiStatement";
import { PREFIX_PEBL, PREFIX_PEBL_THREAD } from "../utils/constants";

export class Quiz extends XApiStatement {

  readonly book: string;

  readonly score?: number;
  readonly min?: number;
  readonly max?: number;

  readonly activityId: string;

  readonly quizId?: string;
  readonly quizName?: string;

  readonly completion?: boolean;
  readonly success?: boolean;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;

    this.book = object.id;
    if (this.book.indexOf(PREFIX_PEBL) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL) + PREFIX_PEBL.length);
    else if (this.book.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL_THREAD) + PREFIX_PEBL_THREAD.length);

    if (this.result) {
      if (this.result.score) {
        if (this.result.score.raw)
          this.score = this.result.score.raw;
        if (this.result.score.min)
          this.min = this.result.score.min;
        if (this.result.score.max)
          this.max = this.result.score.max;
      }

      if (this.result.completion)
        this.completion = this.result.completion;
      if (this.result.success)
        this.success = this.result.success;
    }



    if (object.definition && object.definition.name)
      this.quizId = object.definition.name["en-US"];

    if (object.definition && object.definition.description)
      this.quizName = object.definition.description["en-US"];

    this.activityId = object.id;
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "failed") || (verb == "passed");
  }

}