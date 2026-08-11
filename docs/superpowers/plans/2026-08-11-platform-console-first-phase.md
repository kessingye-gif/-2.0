# Platform Console First Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the contract-oriented demo with a small, route-driven headquarters console that shows traceable institution quota, student activation, learning usage, and actionable exception data.

**Architecture:** Add React Router as the navigation boundary, keep the existing mock records as the only data source, and derive every dashboard number and drill-down query from those records. Split pages by business responsibility while preserving reusable table and presentation components; do not build institution or teacher portals in this phase.

**Tech Stack:** React 19, TypeScript 5.8, React Router DOM, Vite 6, Tailwind CSS 4, Node test runner.

## Global Constraints

- Do not introduce contract, signing, or payment-collection workflow concepts.
- Do not invent dashboard values that cannot be derived from `src/mockData.ts`.
- Super administrators inherit institution-admin and teacher capabilities. Teacher import, teacher quota allocation, class/student management, and learning-detail actions live under institution detail rather than separate platform top-level navigation.
- Institution content-center pages and teacher pages are out of scope for this phase.
- Use semantic links for navigation and preserve filter state in URL query parameters.
- Every primary action must have a real handler and visible success or failure feedback.
- Prefer focused files and explicit page components; do not add new `mode` props.

---

### Task 1: Route Model and Platform Navigation

**Files:**
- Modify: `package.json`
- Create: `src/router/platformRoutes.ts`
- Modify: `src/navigation.ts`
- Modify: `src/navigation.test.ts`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/App.tsx`
- Test: `src/navigation.test.ts`

**Interfaces:**
- Produces: `PlatformRouteId`, `PlatformRoute`, `platformRoutes`, `getPlatformRoute(id)`, and route-based sidebar links.
- Consumes: Existing view components during the migration; routes may temporarily render those explicit views until later tasks split them.

- [ ] **Step 1: Write failing navigation tests**

Assert that navigation labels are exactly `经营驾驶舱`, `机构与额度`, `开通与使用`, `售后与异常`, `内容中心`, `数据与审计`, `平台设置`; assert no label contains `合同` or `签约`; assert every item exposes an absolute `/platform/...` path.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `npx tsx --test src/navigation.test.ts`

Expected: failure because the current navigation still contains `客户与合同` and has no paths.

- [ ] **Step 3: Install and configure React Router DOM**

Run: `npm install react-router-dom`

Add explicit platform route records in `src/router/platformRoutes.ts`; remove `resolveLegacyView` and `currentTab` as the primary routing mechanism.

- [ ] **Step 4: Convert the shell and sidebar to route navigation**

Wrap the application with `BrowserRouter`; render page content through `Routes`/`Route`; convert sidebar buttons to `NavLink`; use `Navigate` from `/` to `/platform/dashboard`.

- [ ] **Step 5: Run the focused test and type check**

Run: `npx tsx --test src/navigation.test.ts`

Run: `npm run lint`

Expected: all assertions pass and TypeScript exits with code 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/router/platformRoutes.ts src/navigation.ts src/navigation.test.ts src/components/layout/Sidebar.tsx src/App.tsx
git commit -m "refactor: add platform route boundary"
```

### Task 2: Traceable Dashboard Data Model

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/dashboardSnapshot.ts`
- Create: `src/dashboardSnapshot.test.ts`
- Modify: `src/mockData.ts` only if an existing learning field needs a clearly named fixture; do not add totals by hand.
- Remove after migration: `src/fulfillment.ts` dashboard-only derivation

**Interfaces:**
- Produces: `derivePlatformDashboardSnapshot(input): PlatformDashboardSnapshot`.
- `PlatformDashboardSnapshot` contains `updatedAt`, four named sections, metric `sourceLabel`, `definition`, `targetPath`, and work items with exact target URLs.
- Consumes: institutions, students, auth codes, order ledger, audit logs, and existing learning/diagnostic records from mock data.

- [ ] **Step 1: Write failing derivation tests**

Cover these behaviors independently:

- institution quota equals the sum of `Institution.totalQuota` and remaining quota equals the sum of `remainingQuota`;
- low-quota institutions are derived from the documented threshold, not hard-coded;
- student total and activation counts come from students/auth codes;
- every metric has a non-empty source label, definition, and `/platform/...` target path;
- work items point to filtered URLs such as `/platform/institutions?quota=low` and `/platform/activations?status=pending`;
- derived labels and IDs contain no contract/signing terms.

- [ ] **Step 2: Run the test and verify it fails because the new API is missing**

Run: `npx tsx --test src/dashboardSnapshot.test.ts`

- [ ] **Step 3: Implement the minimal derivation module**

Compute all values from existing arrays. If no reliable learning-event fixture exists, display only student service activity already present in the data; do not fabricate practice totals, report totals, or trends.

- [ ] **Step 4: Run the focused and existing derivation tests**

Run: `npx tsx --test src/dashboardSnapshot.test.ts src/fulfillment.test.ts`

Expected: all tests pass; update or retire contract-oriented assertions only after the replacement test is green.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/dashboardSnapshot.ts src/dashboardSnapshot.test.ts src/mockData.ts src/fulfillment.ts src/fulfillment.test.ts
git commit -m "refactor: derive traceable platform metrics"
```

### Task 3: Simple Four-Section Platform Dashboard

**Files:**
- Modify: `src/components/views/DashboardView.tsx`
- Modify: `src/components/views/DashboardView.test.ts`
- Create: `src/components/dashboard/MetricLink.tsx`
- Create: `src/components/dashboard/DashboardSection.tsx`
- Modify: `src/App.tsx`
- Remove: `src/components/dashboard/FulfillmentFunnel.tsx`

**Interfaces:**
- `DashboardView({ snapshot })` consumes `PlatformDashboardSnapshot` and uses route links directly.
- `MetricLink` renders label, value, source/definition disclosure, and semantic link target.

- [ ] **Step 1: Replace the old dashboard tests with failing product-boundary tests**

Assert the rendered page contains `机构与额度`, `学生与开通`, `学习与使用`, `待办与异常`, `数据更新于`, and source descriptions. Assert it does not contain `商业履约驾驶舱`, `七段履约漏斗`, `签约`, `合同`, or `回款`.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `npx tsx --test src/components/views/DashboardView.test.ts`

- [ ] **Step 3: Implement the four-section dashboard**

Use a compact card layout rather than another funnel. Each metric is a `Link`; each work item is a `Link`; show only values supported by the snapshot. Keep the updated-at and source wording visible without tooltips being the sole access method.

- [ ] **Step 4: Run dashboard tests and type check**

Run: `npx tsx --test src/components/views/DashboardView.test.ts src/dashboardSnapshot.test.ts`

Run: `npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/components/views/DashboardView.tsx src/components/views/DashboardView.test.ts src/components/dashboard/MetricLink.tsx src/components/dashboard/DashboardSection.tsx src/components/dashboard/FulfillmentFunnel.tsx src/App.tsx
git commit -m "feat: rebuild platform dashboard around real data"
```

### Task 4: Exact Drill-Down Pages and URL Filters

**Files:**
- Create: `src/features/institutions/institutionFilters.ts`
- Create: `src/features/institutions/institutionFilters.test.ts`
- Create: `src/features/activations/activationFilters.ts`
- Create: `src/features/activations/activationFilters.test.ts`
- Create: `src/pages/platform/InstitutionsPage.tsx`
- Create: `src/pages/platform/ActivationsPage.tsx`
- Create: `src/pages/platform/LearningOverviewPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/GlobalSearchPanel.tsx`
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces pure `filterInstitutions(items, searchParams)` and `filterActivations(items, searchParams)` functions.
- Global search results expose `targetPath` rather than a top-level tab.
- Dashboard and search links open exact filtered URLs.

- [ ] **Step 1: Write failing pure filter tests**

Test low quota, unconfigured service scope, pending activation, institution ID, teacher name, and student name filters. Test that unrelated query parameters do not change results.

- [ ] **Step 2: Run tests and verify the functions are missing**

Run: `npx tsx --test src/features/institutions/institutionFilters.test.ts src/features/activations/activationFilters.test.ts`

- [ ] **Step 3: Implement pure filters and small route pages**

Pages read `useSearchParams`, render the active filter visibly, provide a clear-filter link, show row counts, and use existing mock records. `LearningOverviewPage` presents only institution/student service-activity fields actually available; unsupported learning metrics are omitted.

- [ ] **Step 4: Convert global search to exact links**

Institution results target `/platform/institutions/:id`; student/auth-code results target a filtered activation or learning URL; order results target after-sales only when the record is a refund, otherwise a simple read-only usage/ledger route retained from the existing page.

- [ ] **Step 5: Run focused tests and type check**

Run: `npx tsx --test src/features/institutions/institutionFilters.test.ts src/features/activations/activationFilters.test.ts src/navigation.test.ts`

Run: `npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/features src/pages/platform src/App.tsx src/components/layout/GlobalSearchPanel.tsx src/types/index.ts
git commit -m "feat: add exact platform drill downs"
```

### Task 5: Platform Content and Institution Detail Boundaries

**Files:**
- Create: `src/pages/platform/PlatformContentPage.tsx`
- Create: `src/pages/platform/InstitutionDetailPage.tsx`
- Create: `src/features/content/contentOwnership.ts`
- Create: `src/features/content/contentOwnership.test.ts`
- Modify: `src/components/views/QuestionBankView.tsx`
- Modify: `src/components/views/InstitutionView.tsx`
- Modify: `src/types/index.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces `canManageContent(user, ownership)` and explicit platform page wrappers.
- Platform content labels its subjects, packages, questions, and knowledge points as platform-owned assets.
- Institution detail links quota, assigned content/service scope, student/activation summary, and audit events by institution ID.

- [ ] **Step 1: Write failing content-ownership tests**

Assert platform admins can manage platform resources; institution admins cannot modify platform resources; institution admins can manage only matching-institution resources; teachers cannot manage unrelated teacher or institution resources.

- [ ] **Step 2: Run the ownership test and verify failure**

Run: `npx tsx --test src/features/content/contentOwnership.test.ts`

- [ ] **Step 3: Implement ownership types and permission function**

Use `ownerType`, `ownerId`, optional `institutionId`, and optional `teacherId`. Keep the function pure and independent from visual components.

- [ ] **Step 4: Add explicit platform content and institution detail pages**

Do not build institution-side content pages. Reuse existing content tables inside a platform-only wrapper and update wording to `平台题库` and `平台知识点`. Institution detail reuses teacher, class, student, quota-allocation, and learning modules with an explicit institution scope; super-administrator actions record actor, acting scope, target institution, action, and reason.

- [ ] **Step 5: Run focused tests, all tests, and type check**

Run: `npx tsx --test src/features/content/contentOwnership.test.ts`

Run: `npx tsx --test src/**/*.test.ts`

Run: `npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/pages/platform src/features/content src/components/views/QuestionBankView.tsx src/components/views/InstitutionView.tsx src/types/index.ts src/App.tsx
git commit -m "refactor: enforce platform content boundaries"
```

### Task 6: Remove Dead Controls and Verify the Platform Flow

**Files:**
- Modify: `src/components/views/SystemView.tsx`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/modals/HelpModal.tsx`
- Modify: affected tests

**Interfaces:**
- No new product scope. This task removes or completes controls visible in routes retained by Tasks 1-5.

- [ ] **Step 1: Write failing tests for retained controls**

Cover the Token order search filter, real institution pagination state, exact notification navigation, and accessible names for icon-only controls. If a control has no supported data operation, remove it instead of simulating success.

- [ ] **Step 2: Run focused tests and verify expected failures**

Run the exact new test files with `npx tsx --test`.

- [ ] **Step 3: Implement the smallest closed-loop behavior**

Replace browser `alert()` success messages in retained flows with the existing toast; remove unsupported primary actions; add confirmation plus reason for destructive retained actions; add dialog semantics and keyboard close behavior to touched dialogs.

- [ ] **Step 4: Run complete verification**

Run: `npx tsx --test src/**/*.test.ts`

Run: `npm run lint`

Run: `npm run build`

Expected: zero test failures, TypeScript exit code 0, Vite build exit code 0.

- [ ] **Step 5: Browser walkthrough**

Verify at 1280px and a narrow viewport:

- direct load and refresh of every sidebar route;
- browser back/forward;
- dashboard metric drill-down and visible filter state;
- global search exact-record navigation;
- no contract/signing/collection wording;
- no visible primary button without an action;
- keyboard-visible focus and Escape close on touched dialogs.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "fix: close retained platform interactions"
```
