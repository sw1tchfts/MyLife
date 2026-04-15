Audit dependencies in package.json.

Steps:

1. Compare declared dependencies vs actual imports in /src and config files
2. Check for peer dependency relationships (e.g. @supabase/supabase-js is a peer dep of @supabase/ssr)
3. Identify:
   - Unused dependencies (not imported anywhere, not a peer dep)
   - Missing dependencies (imported but not declared)
   - Dev dependencies used in production code
   - Dependencies only used in config files (not in /src)

Output:

- Unused packages (safe to remove)
- Possibly unused (manual review — may be peer deps or config-only)
- Missing dependencies (with file references)
- Dev dependencies used in production code

Do not modify package.json.
