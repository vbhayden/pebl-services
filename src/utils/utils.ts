export function stringIsInvalidJson(string: string): boolean {
  if (string.match(/[\b\f\n\r\t\v\0]/))
    return false;
  return true;
}
