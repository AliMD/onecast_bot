import {read} from './files';

var texts = read('fa', {}, './l10n');

export function l10n (key = '!') {
  let val = texts[key.toLowerCase()];
  return val ? val : key
}
