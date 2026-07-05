---
name: Orval barrel export collisions
description: Why @workspace/api-zod fails to typecheck with TS2308 after running api-spec codegen, and how to fix it.
---

Orval generates two parallel modules for the same OpenAPI request-body schemas: a runtime zod object in `generated/api.ts` and a TS interface of the same name in a standalone file under `generated/types/*.ts` (barrel-exported via `generated/types/index.ts`). `lib/api-zod/src/index.ts` does `export * from "./generated/api"` and `export * from "./generated/types"`, so any body schema name that exists in both places (typically `*Body` schemas referenced inline in a path's requestBody, e.g. `BanUserBody`, `ChangeUserRoleBody`) throws TS2308 "already exported" ambiguity errors.

**Why:** Orval's `zod` client target inlines body schemas as zod consts in `api.ts`, while its `types` target also emits them as standalone interface files — both included in `generated/types/index.ts`'s `export *` list. This is a codegen quirk, not something the OpenAPI spec authoring can avoid.

**How to apply:** After every `pnpm --filter @workspace/api-spec run codegen` run, if `pnpm -w run typecheck:libs` reports TS2308 "already exported a member" for specific names, open `lib/api-zod/src/generated/types/index.ts` and delete the `export * from './<name>'` line for each colliding name (they're already available via the `api.ts` zod export). This file is regenerated (and the fix wiped) on every codegen run, so it must be reapplied each time new colliding body types are introduced.
