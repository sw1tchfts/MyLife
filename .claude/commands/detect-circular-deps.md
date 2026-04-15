Scan /src for circular dependencies.

Steps:

1. Build an import graph of all files in /src
2. Detect cycles using depth-first traversal
3. Classify severity based on cycle depth and impact

Output:

- Dependency chains forming cycles (A → B → C → A)
- Files involved in each cycle
- Severity (low/medium/high based on depth and number of files affected)
- Suggested refactor for each cycle (e.g. dependency inversion, shared module extraction, interface segregation)

If no circular dependencies are found, report that the codebase is clean.
