import { join } from 'path';
export const COUNT_BLOCKS = 3000;
export const BLOCKS_FILE_PATH = join(__dirname, '../', 'blocks/');
export const EVENT = 'Transfer';
export const MAX_RETRIES = 5;
export const MAX_ATTEMPTS = 3;
export const MAX_VALUE =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';
export const SEC_IN_MS = 1000;
export const MINUTE_IN_MS = SEC_IN_MS * 60;
