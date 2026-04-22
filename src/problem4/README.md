# Problem 4: Three Ways to Sum to N

Three implementations for summing all integers between `n` and `0`.

## Assumption

- `n` is an integer (positive, negative, or zero).
- **If `n >= 0`:** sum all integers from `0` to `n` → `0 + 1 + 2 + ... + n`
- **If `n < 0`:** sum all integers from `n` to `0` → `n + (n+1) + ... + 0`

---

## Implementations

### 1. Iterative (`sumToNA`)

```typescript
function sumToNA(n: number): number {
  let total = 0;
  if (n >= 0) {
    for (let i = 0; i <= n; i++) total += i;
  } else {
    for (let i = n; i <= 0; i++) total += i;
  }
  return total;
}
```

| | |
|---|---|
| **Time Complexity** | `O(n)` — loops through `n` iterations |
| **Space Complexity** | `O(1)` — single accumulator variable, no extra memory |

---

### 2. Recursive (`sumToNB`)

```typescript
function sumToNB(n: number): number {
  if (n === 0) return 0;
  return n > 0 ? n + sumToNB(n - 1) : n + sumToNB(n + 1);
}
```

| | |
|---|---|
| **Time Complexity** | `O(n)` — `n` recursive calls until base case `0` |
| **Space Complexity** | `O(n)` — each call adds a frame to the call stack |

> This approach may cause a **Stack Overflow** for very large values of `n`.

---

### 3. Mathematical / Closed-form (`sumToNC`)

```typescript
function sumToNC(n: number): number {
  return (n * (Math.abs(n) + 1)) / 2;
}
```

| | |
|---|---|
| **Time Complexity** | `O(1)` — fixed arithmetic operations regardless of `n` |
| **Space Complexity** | `O(1)` — no additional memory allocated |

**Derivation:**
- Positive case: `sum(0..n) = n*(n+1)/2` (Gauss's formula)
- Negative case: `sum(n..0) = n*(|n|+1)/2` (same structure, sign carried by `n`)
- Unified formula: `n * (|n| + 1) / 2`

---

## Test Cases

| Input `n` | Range Summed | Expected Output |
| :---: | :---: | :---: |
| `5` | `0 + 1 + 2 + 3 + 4 + 5` | `15` |
| `1` | `0 + 1` | `1` |
| `0` | `0` | `0` |
| `-1` | `-1 + 0` | `-1` |
| `-3` | `-3 + (-2) + (-1) + 0` | `-6` |

---

## Comparison

| Approach | Time | Space | Notes |
| :--- | :---: | :---: | :--- |
| Iterative | `O(n)` | `O(1)` | Simple, safe for large `n` |
| Recursive | `O(n)` | `O(n)` | Risk of stack overflow for large `n` |
| Mathematical | `O(1)` | `O(1)` | Best performance, constant time |
