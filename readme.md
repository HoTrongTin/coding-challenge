# 99Tech Code Challenge #1

This repository contains solutions for the 99Tech Code Challenge. The challenge consists of three problems, each located in its respective directory within `src/`.

## Table of Contents

1. [Problem 4: Three ways to sum to n](./src/problem4/)
2. [Problem 5: A Crude Server](./src/problem5/)
3. [Problem 6: Architecture](./src/problem6/)

---

## [Problem 4: Three ways to sum to n](./src/problem4/)

Provide 3 unique implementations of a function to sum to `n` in TypeScript, commenting on the complexity and efficiency of each.

**Input**: `n` - any integer  
*Assuming this input will always produce a result lesser than `Number.MAX_SAFE_INTEGER`*.

**Output**: `return` - summation to `n`, i.e., `sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15`.

👉 **[View Solution](./src/problem4/)**

---

## [Problem 5: A Crude Server](./src/problem5/)

Develop a backend server with ExpressJS. Build a set of CRUD interfaces allowing a user to interact with the service using TypeScript.

**Functionalities:**
1. Create a resource.
2. List resources with basic filters.
3. Get details of a resource.
4. Update resource details.
5. Delete a resource.

The backend service is connected to a simple database for data persistence.

👉 **[View Solution](./src/problem5/)**

---

## [Problem 6: Architecture](./src/problem6/)

Write the specification for a software module on the API service (backend application server) for a live scoreboard.

**Requirements:**
1. A website with a scoreboard showing the top 10 users' scores.
2. Live updates of the scoreboard.
3. Users can perform an action to increase their score.
4. Upon action completion, an API call is dispatched to update the score.
5. Prevent malicious users from increasing scores without authorization.

👉 **[View Solution](./src/problem6/)**