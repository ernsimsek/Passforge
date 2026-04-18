/** Cryptographically secure integers in [0, exclusiveMax). Rejection sampling avoids modulo bias. */
export function randomUint32(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]!;
}

export function randomIntBelow(exclusiveMax: number): number {
  if (exclusiveMax <= 0 || exclusiveMax > 0xffffffff) {
    throw new RangeError("exclusiveMax must be in (0, 2^32]");
  }
  const limit = Math.floor(0x1_0000_0000 / exclusiveMax) * exclusiveMax;
  let x: number;
  do {
    x = randomUint32();
  } while (x >= limit);
  return x % exclusiveMax;
}

export function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomIntBelow(i + 1);
    [items[i], items[j]] = [items[j], items[i]!];
  }
}
