Scan the /src directory for unused code.

Definition of unused:

- Functions, classes, or exports that have zero static references
- Exclude: dynamic imports, reflection, string-based usage, or framework-driven usage (e.g. routing, DI)

Steps:

1. Build a reference map of all imports/exports
2. Identify candidates with zero inbound references
3. Flag "uncertain" cases separately (dynamic usage risk)

Output:

- Section 1: Definitely unused (safe to delete)
- Section 2: Potentially unused (manual review required)
- Include file path + symbol name + reasoning

Do NOT delete anything. Only report.
