# OnlyStudent MVP Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Deliver a locally running teacher/student platform with isolated Docker dependencies.
**Architecture:** React calls NestJS REST API. Prisma persists relational data, Redis caches public listings, MinIO stores authenticated resources.
**Tech Stack:** TypeScript, React, NestJS, Prisma, PostgreSQL, Redis, MinIO.
**Spec:** ../specs/2026-11-05-onlystudent-mvp-design.md

## Global Constraints
- Fixed account roles ADMIN / TEACHER / STUDENT.
- Mock payments only; provider interface retained.
- Independent onlystudent-mvp Compose project and volumes; localhost bindings only.

## Review Focus
- Concurrent purchases must never double debit: unique enrollment and transaction tests.
- Invalid/negative money must be rejected: API validation tests.
- Nonmembers cannot access class files or submissions: authorization tests.
- Students must never receive quiz answer keys before submission: response tests.
- Restart must preserve balances and uploaded files: idempotent seed and volume checks.

### Task 1: API and persistence
Files: apps/api/src/{main,auth,school,payments,storage}.ts; apps/api/prisma/schema.prisma; tests/smoke.mjs.
Interfaces: POST /api/auth/login returns {token,user}; GET /api/me returns user; remaining endpoints authenticated with Bearer JWT.
- [ ] Write smoke assertions for login, unauthorized access, role restrictions, purchases and class submission.
- [ ] Run against missing server and observe failure.
- [ ] Implement schema, idempotent seed, auth, courses, classes, wallet, uploads and admin endpoints.
- [ ] Run TypeScript build and smoke against running stack.

### Task 2: Browser experience
Files: apps/web/src/{App.tsx,api.ts,style.css}; apps/web/index.html.
Interfaces: API JSON; multipart files; protected role-aware routes.
- [ ] Implement login, home, courses/detail, class/detail, profile and admin views.
- [ ] Include loading, error, empty and success states and responsive navigation.
- [ ] Build with TypeScript and verify student/teacher flows in browser.

### Task 3: Deployment and verification
Files: compose.yaml; apps/api/Dockerfile; apps/web/Dockerfile; README.md; .env.example.
- [ ] Configure dedicated project, health checks and persistent volumes.
- [ ] Start stack; execute smoke tests and fix any failures.
- [ ] Review authorization and money behavior independently.
- [ ] Document commands, credentials, payment abstraction and limitations.

Execution: native implementation in this session, following user's instruction to start.
