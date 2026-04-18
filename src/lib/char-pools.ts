export type CharsetFlags = {
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};

const UPPER_FULL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER_FULL = "abcdefghijklmnopqrstuvwxyz";
const DIGITS_FULL = "0123456789";
const SYMBOLS = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

const UPPER_SAFE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER_SAFE = "abcdefghijkmnopqrstuvwxyz";
const DIGITS_SAFE = "23456789";

export function buildPools(flags: CharsetFlags): string[] {
  const pools: string[] = [];
  const amb = flags.excludeAmbiguous;

  if (flags.upper) pools.push(amb ? UPPER_SAFE : UPPER_FULL);
  if (flags.lower) pools.push(amb ? LOWER_SAFE : LOWER_FULL);
  if (flags.digits) pools.push(amb ? DIGITS_SAFE : DIGITS_FULL);
  if (flags.symbols) pools.push(SYMBOLS);

  return pools;
}

export function unionPool(pools: string[]): string {
  return pools.join("");
}
