// export function replaceInvalidJson(str: string): string {
//   return str.replace(/[\\]/g, '\\\\')
//     .replace(/[\"]/g, '\\\"')
//     .replace(/[\/]/g, '\\/')
//     .replace(/[\b]/g, '\\b')
//     .replace(/[\f]/g, '\\f')
//     .replace(/[\n]/g, '\\n')
//     .replace(/[\r]/g, '\\r')
//     .replace(/[\t]/g, '\\t')
// }

export function popThroughArrayFn<T>(fn: (x: T, next: (() => void)) => void, done: () => void): ((arr: T[]) => void) {
  let p = (arr: T[]) => {
    let f = () => {
      let item: (undefined | T) = arr.pop();
      if (item)
        fn(item, f);
      else
        done();
    }
    f();
  }
  return p;
}

export function popThroughArray<T>(arr: T[], fn: (x: T, next: (() => void)) => void, done: () => void): void {
  let p = () => {
    let item: (undefined | T) = arr.pop();
    if (item)
      fn(item, p);
    else
      done();
  }
  p();
}
