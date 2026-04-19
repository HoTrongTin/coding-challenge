
/**
 * This is using iteration
 * - Time Complexity: O(n)
 * - Space Complexity: O(1)
 * @param n
 * @returns
 */
function sumToNA(n: number): number {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}

/**
 * This is using recursion
 * - Time Complexity: O(n)
 * - Space Complexity: O(n)
 * @param n
 * @returns
 */
function sumToNB(n: number): number {
  if (n === 1) return 1;
  return n + sumToNB(n - 1);
}

/**
 * This is using close form
 * - Time Complexity: O(1)
 * - Space Complexity: O(1)
 * @param n
 * @returns
 */
function sumToNC(n: number): number {
  return (n * (n + 1)) / 2;
}


function main() {
  const n = 5;
  console.log('Sum to n (a):', sumToNA(n));
  console.log('Sum to n (b):', sumToNB(n));
  console.log('Sum to n (c):', sumToNC(n));
}

main();