/**
 * Assumptions:
 * - n is an integer (positive, negative, or zero).
 * - If n >= 0: sum all integers from 0 to n  → 0 + 1 + 2 + ... + n
 * - If n < 0:  sum all integers from n to 0  → n + (n+1) + ... + 0
 */

/**
 * Iterative approach
 * - Time Complexity:  O(n) — loops through |n| + 1 iterations
 * - Space Complexity: O(1) — single accumulator variable
 */
function sumToNA(n: number): number {
  let total = 0;
  if (n >= 0) {
    for (let i = 0; i <= n; i++) total += i;
  } else {
    for (let i = n; i <= 0; i++) total += i;
  }
  return total;
}

/**
 * Recursive approach
 * - Time Complexity:  O(n) — |n| + 1 recursive calls
 * - Space Complexity: O(n) — call stack depth equals |n| + 1
 */
function sumToNB(n: number): number {
  if (n === 0) return 0;
  return n > 0 ? n + sumToNB(n - 1) : n + sumToNB(n + 1);
}

/**
 * Mathematical (closed-form) approach
 * - Time Complexity:  O(1) — fixed number of arithmetic operations
 * - Space Complexity: O(1) — no extra memory used
 *
 * Derivation:
 *   Positive: sum(0..n)  = n*(n+1)/2
 *   Negative: sum(n..0)  = n*(|n|+1)/2  (same formula, sign carried by n)
 *   Unified:  n * (|n| + 1) / 2
 */
function sumToNC(n: number): number {
  return (n * (Math.abs(n) + 1)) / 2;
}

// ─── Test Cases ───────────────────────────────────────────────────────────────

const testCases: { input: number; expected: number }[] = [
  { input: 5,  expected: 15  }, // 0+1+2+3+4+5
  { input: 1,  expected: 1   }, // 0+1
  { input: 0,  expected: 0   }, // 0
  { input: -1, expected: -1  }, // -1+0
  { input: -3, expected: -6  }, // -3+-2+-1+0
];

function runTests() {
  const fns = [
    { name: 'sumToNA (Iterative)',    fn: sumToNA },
    { name: 'sumToNB (Recursive)',    fn: sumToNB },
    { name: 'sumToNC (Mathematical)', fn: sumToNC },
  ];

  for (const { name, fn } of fns) {
    console.log(`\n── ${name} ──`);
    for (const { input, expected } of testCases) {
      const result = fn(input);
      const status = result === expected ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status}  sumToN(${String(input).padStart(3)}) = ${String(result).padStart(4)}  (expected ${expected})`);
    }
  }
}

runTests();