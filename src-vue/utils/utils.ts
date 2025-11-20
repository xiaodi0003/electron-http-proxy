/* eslint no-useless-escape:0 import/prefer-default-export:0 */
const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;

export const isUrl = (path: string): boolean => reg.test(path);

export function getDomain(url: string) {
  return url.replace(/.*?:\/\/([^/]*).*/, '$1');
}

export function getPath(url: string) {
  return url.replace(/.*?:\/\/[^/]*(.*)/, '$1');
}

export function getProtocol(url: string) {
  return url.replace(/(.*?):.*/, '$1');
}

export function getPort(url: string) {
  const match = url.match(/.*?:\/\/.*?:(\d+).*/);
  return match ? Number(match[1]) : (getProtocol(url).toLocaleLowerCase() === 'https' ? 443 : 80);
}
