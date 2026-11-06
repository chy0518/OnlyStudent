# SDD ledger — plan: docs/superpowers/plans/2026-11-05-onlystudent-mvp.md

Ruling: Work directly in the user's new empty directory, which is not a git repository. No existing branch/worktree to isolate; all project files remain in requested location.
Pre-flight: Task 2 consumes REST interfaces from Task 1; Task 3 proxies /api and runs the compiled API. Consistent.
Task 1: API and schema implemented, backend TypeScript build passed. Live smoke still pending Docker build.
Task 2: Frontend implemented. Build pending dependencies.
Task 3: Docker Desktop started. PostgreSQL and Redis images pulled. Official MinIO image registries unavailable; use official fixed-tag source build.
Ruling: Flat course resource lists and class lesson activities implement the initial teaching skeleton; nested course chapter editor and streaming preview are deferred and documented.
Ruling: No automated commits in this non-git directory. Keep files directly reviewable for user.

Task 1: complete — npm run build, npm test, real PostgreSQL/Redis/MinIO API smoke pass.
Task 2: complete — production build and Chrome browser tests pass, desktop and mobile screenshots inspected.
Task 3: complete — five project containers running, backend dependencies healthy, full restart persistence test passed.
Final review: independent reviewer identified roster, homepage announcements and reused-attachment access. All three fixed; feed regression verified 404 on old image then 200 after rebuild, roster browser test and cross-teacher attachment API test passed.
Ruling: npm audit's 11 unresolved dependency advisories require version migrations beyond compatible fixes; documented in README. Local-only binding retained; this release is not approved for public deployment.
Ruling: Final implementation uses authenticated API file streaming rather than public presigned URLs, preserving access control and avoiding an extra exposed MinIO port.
Final: test-generated courses/classes and submissions cleaned after exact title/description inspection; seed data, wallet history and uploaded objects retained.
