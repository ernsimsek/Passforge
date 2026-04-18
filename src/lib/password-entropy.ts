import { buildPools, unionPool, type CharsetFlags } from "@/lib/char-pools";

/** Shannon entropy in bits for i.i.d. uniform picks from the union alphabet (approximation). */
export function passwordEntropyApprox(length: number, flags: CharsetFlags): number {
  const pools = buildPools(flags);
  if (pools.length === 0 || length <= 0) return 0;
  const n = unionPool(pools).length;
  if (n <= 1) return 0;
  return length * (Math.log(n) / Math.log(2));
}

export function entropyLabel(bits: number): "Weak" | "Fair" | "Strong" | "Excellent" {
  if (bits < 36) return "Weak";
  if (bits < 60) return "Fair";
  if (bits < 80) return "Strong";
  return "Excellent";
}
