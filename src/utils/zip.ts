let pako = require("pako");


const stringObj = { "to": "string" };

export function pakoInflate(data: string): string {
  return pako.inflate(data, stringObj);
}

export function pakoDeflate(data: string): string {
  return pako.deflate(data, stringObj);
}
