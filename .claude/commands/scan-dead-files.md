Identify orphaned files in /src.

Definition:

- Files that are not imported anywhere in the codebase
- Exclude entry points (page.tsx, layout.tsx, loading.tsx, route.ts), config files, proxy.ts, and test files

Steps:

1. List all .ts and .tsx files in /src
2. For each file, search for import references across the codebase
3. Check for dynamic imports (next/dynamic) that may not appear in static grep
4. Classify confidence level based on import evidence

Output:

- List of orphaned files
- Confidence level (high/medium/low)
- Any detected indirect usage risks (dynamic imports, framework conventions)

Do not delete — only recommend.
