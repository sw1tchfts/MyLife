Create a prioritized cleanup plan for this repo.

Steps:

1. Run all analysis passes:
   - Unused code scan (exports with zero references)
   - Dead file detection (orphaned files)
   - Dependency audit (unused/missing packages)
   - Circular dependency check
   - Debug artifact scan (console.log, TODO/FIXME comments)
2. Rank findings by:
   - Risk (low → high)
   - Impact (low → high)
3. Group into phases:
   - Phase 1: Safe (no behavior change — dead code removal, unused exports)
   - Phase 2: Moderate (refactors — restructuring, dependency cleanup)
   - Phase 3: Risky (architecture changes — circular dep resolution, API surface reduction)

Output:

- Actionable checklist organized by phase
- Files affected per item
- Dependencies between cleanup tasks (e.g. "delete file X before removing export Y")

Do NOT make any changes. Report only.
