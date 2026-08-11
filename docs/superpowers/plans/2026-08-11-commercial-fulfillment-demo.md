# Commercial Fulfillment Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the headquarters console around a visible, clickable commercial-fulfillment lifecycle that a business owner can understand from the first screen.

**Architecture:** Keep the existing React single-page application and mock-data state store, but introduce a small fulfillment domain module that derives dashboard metrics, funnel steps, work items, and search results from shared state. Reuse the current institution, goods, system, and audit views behind clearer business navigation; replace the dashboard and extend institution detail instead of creating a second parallel application.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Node built-in test runner.

## Global Constraints

- This phase is a desktop interactive demo using mock data; do not add a backend or persistence dependency.
- Refreshing the page may restore the initial demo data.
- Commercial fulfillment is the primary storyline; teacher, class, student, and diagnostics remain supporting context.
- Every primary navigation item must render meaningful content and every primary action must respond.
- Derived metrics must come from shared mock business data rather than duplicated hard-coded values.
- Risky demo actions such as refunds and credit clawbacks require explicit confirmation and explain their impact.
- Preserve the current green visual language and existing component patterns.

---

### Task 1: Fulfillment domain model and selectors

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/fulfillment.ts`
- Create: `src/fulfillment.test.ts`
- Modify: `src/mockData.ts`

**Interfaces:**
- Produces: `FulfillmentSnapshot`, `FulfillmentWorkItem`, `FulfillmentEvent`, `deriveFulfillmentSnapshot(...)`, and `buildGlobalSearchResults(...)`.
- Consumes: existing `Institution`, `AuthCode`, `StudentItem`, `OrderLedgerRecord`, and `AuditLogItem` structures.

- [ ] **Step 1: Write failing selector tests**

```ts
test('derives the seven-stage fulfillment funnel from shared records', () => {
  const snapshot = deriveFulfillmentSnapshot({ institutions, authCodes, students, orders, auditLogs });
  assert.deepEqual(snapshot.funnel.map((step) => step.id), [
    'contracted', 'funded', 'configured', 'issued', 'activated', 'servicing', 'renewal',
  ]);
  assert.equal(snapshot.funnel.find((step) => step.id === 'activated')?.value, 1);
});

test('global search returns a routable authorization-code result', () => {
  const results = buildGlobalSearchResults('8829', { institutions, authCodes, students, orders });
  assert.equal(results[0]?.targetTab, 'fulfillment');
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --import tsx --test src/fulfillment.test.ts`

Expected: FAIL because `deriveFulfillmentSnapshot` and `buildGlobalSearchResults` do not exist.

- [ ] **Step 3: Add focused fulfillment types and deterministic mock records**

```ts
export type FulfillmentStageId =
  | 'contracted' | 'funded' | 'configured' | 'issued'
  | 'activated' | 'servicing' | 'renewal';

export interface FulfillmentFunnelStep {
  id: FulfillmentStageId;
  label: string;
  value: number;
  displayValue: string;
  conversionRate?: number;
  targetTab: NavTab;
}
```

Add deterministic contract amounts and order-ledger records to `mockData.ts`; do not generate dates or values at module load time.

- [ ] **Step 4: Implement pure selectors**

`deriveFulfillmentSnapshot` must calculate five headline metrics, seven funnel steps, risk institutions, work items, and recent events without mutating its arguments. `buildGlobalSearchResults` must search institution names, student names/accounts, authorization codes, and order numbers, returning at most eight routable matches.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `node --import tsx --test src/fulfillment.test.ts && npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/fulfillment.ts src/fulfillment.test.ts src/mockData.ts
git commit -m "feat: add commercial fulfillment domain selectors"
```

### Task 2: Business navigation and working global search

**Files:**
- Modify: `src/navigation.ts`
- Modify: `src/navigation.test.ts`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx`
- Create: `src/components/layout/GlobalSearchPanel.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `GlobalSearchResult[]` from Task 1.
- Produces: eight `NavTab` values: `dashboard`, `customers`, `catalog`, `fulfillment`, `finance`, `afterSales`, `audit`, and `settings`.

- [ ] **Step 1: Replace the current navigation expectations with business-language tests**

```ts
assert.deepEqual(
  navGroups.flatMap((group) => group.items.map((item) => item.label)),
  ['经营驾驶舱', '客户与合同', '商品与定价', '开通与履约', '订单与资金', '售后与异常', '数据与审计', '平台设置'],
);
assert.equal(resolveLegacyView('finance'), 'goods');
assert.equal(resolveLegacyView('afterSales'), 'exceptions');
```

- [ ] **Step 2: Run the navigation test and verify it fails**

Run: `node --import tsx --test src/navigation.test.ts`

Expected: FAIL with old navigation labels.

- [ ] **Step 3: Implement the eight-entry navigation and compact sidebar grouping**

Use a primary business group for the first six items and a system group for audit/settings. Keep the existing sidebar width unless browser verification shows truncation.

- [ ] **Step 4: Add the search result panel and App wiring**

The panel opens only for a non-empty query, groups result types, closes after selection, and calls `onSelect(result.targetTab)`. Update the placeholder to `搜索机构、学生、授权码或订单`.

- [ ] **Step 5: Run navigation tests and typecheck**

Run: `node --import tsx --test src/navigation.test.ts && npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/navigation.ts src/navigation.test.ts src/components/layout/Sidebar.tsx src/components/layout/Header.tsx src/components/layout/GlobalSearchPanel.tsx src/App.tsx
git commit -m "feat: reorganize console around fulfillment navigation"
```

### Task 3: Commercial fulfillment cockpit

**Files:**
- Replace: `src/components/views/DashboardView.tsx`
- Create: `src/components/dashboard/FulfillmentFunnel.tsx`
- Create: `src/components/dashboard/WorkItemList.tsx`
- Create: `src/components/dashboard/FulfillmentTimeline.tsx`
- Create: `src/components/views/DashboardView.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `FulfillmentSnapshot` and `(tab: NavTab) => void`.
- Produces: clickable funnel nodes and work-item actions.

- [ ] **Step 1: Write a source-level contract test for the cockpit**

```ts
const source = readFileSync(new URL('./DashboardView.tsx', import.meta.url), 'utf8');
assert.match(source, /商业履约驾驶舱/);
assert.match(source, /FulfillmentFunnel/);
assert.match(source, /今日待办/);
assert.doesNotMatch(source, /导入知识点和题目/);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --import tsx --test src/components/views/DashboardView.test.ts`

Expected: FAIL because the old operations dashboard is still rendered.

- [ ] **Step 3: Build the headline metrics and seven-step funnel**

Render `snapshot.metrics` as five compact cards. Render every funnel stage even when its value is zero. Funnel buttons must call `onNavigateToTab(step.targetTab)` and expose the stage label as accessible button text.

- [ ] **Step 4: Build work items, institution health, and recent events**

Work items display severity, institution, impact, and a specific action label. Recent events use fulfillment language rather than raw technical audit descriptions.

- [ ] **Step 5: Pass the derived snapshot from App**

Memoize the snapshot from the current institutions, authorization codes, students, order records, and audit logs so demo actions immediately update dashboard values.

- [ ] **Step 6: Run focused tests, typecheck, and build**

Run: `node --import tsx --test src/components/views/DashboardView.test.ts && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/views/DashboardView.tsx src/components/dashboard src/components/views/DashboardView.test.ts src/App.tsx
git commit -m "feat: add commercial fulfillment cockpit"
```

### Task 4: Customer contract and fulfillment detail

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/mockData.ts`
- Modify: `src/components/views/InstitutionView.tsx`
- Create: `src/components/institutions/FulfillmentProgress.tsx`
- Create: `src/components/institutions/InstitutionCommercialSummary.tsx`
- Create: `src/components/institutions/FulfillmentProgress.test.ts`

**Interfaces:**
- Consumes: institution commercial fields and related codes/orders.
- Produces: `getInstitutionFulfillmentProgress(institution, codes, orders)` and a detail drawer summary.

- [ ] **Step 1: Write a failing progression test**

```ts
const progress = getInstitutionFulfillmentProgress(institution, authCodes, orders);
assert.equal(progress[0].status, 'complete');
assert.equal(progress.find((step) => step.id === 'activated')?.count, 2);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --import tsx --test src/components/institutions/FulfillmentProgress.test.ts`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Add contract amount and commercial status to institution mock data**

Use explicit fields `contractAmount`, `contractStatus`, and `contractExpireAt`. Existing institutions receive realistic fixed values.

- [ ] **Step 4: Extend the institution list and drawer**

Rename the page to `客户与合同`. Show contract status and fulfillment health in the list. In the drawer, show the seven-stage progress, contract amount, purchased/remaining credits, activated students, consumed credits, related orders, and active exceptions.

- [ ] **Step 5: Run tests, typecheck, and build**

Run: `node --import tsx --test src/components/institutions/FulfillmentProgress.test.ts && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/mockData.ts src/components/views/InstitutionView.tsx src/components/institutions
git commit -m "feat: show institution commercial fulfillment progress"
```

### Task 5: Split goods into catalog, fulfillment, and finance modes

**Files:**
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/views/QuotaAndAuthCodeView.tsx`
- Create: `src/components/views/GoodsView.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: existing package, token-pack, authorization-code, credit-entry, and order handlers.
- Produces: `GoodsView` prop `mode: 'catalog' | 'fulfillment' | 'finance'`.

- [ ] **Step 1: Write a failing mode contract test**

Assert that `GoodsView.tsx` declares all three mode labels and that App renders the corresponding mode for `catalog`, `fulfillment`, and `finance` navigation tabs.

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --import tsx --test src/components/views/GoodsView.test.ts`

Expected: FAIL because GoodsView currently owns internal tabs rather than business navigation modes.

- [ ] **Step 3: Implement catalog mode**

Show service packages and Token packs, with working create/edit/status actions. Remove unrelated order and authorization-code tabs from this mode.

- [ ] **Step 4: Implement fulfillment mode**

Show the authorization-code lifecycle with institution, student, package, issue date, activation date, expiry date, and status. Replace `生成测试授权码` copy with `生成学生开通码`.

- [ ] **Step 5: Implement finance mode**

Show institution credit entries, package redemptions, Token purchases, and refunds in one ledger. Search and status filters must update the visible records.

- [ ] **Step 6: Run tests, typecheck, and build**

Run: `node --import tsx --test src/components/views/GoodsView.test.ts && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/views/GoodsView.tsx src/components/views/QuotaAndAuthCodeView.tsx src/components/views/GoodsView.test.ts src/App.tsx
git commit -m "feat: separate catalog fulfillment and finance workspaces"
```

### Task 6: After-sales closure, feedback, and end-to-end verification

**Files:**
- Modify: `src/components/views/SystemView.tsx`
- Create: `src/components/ui/Toast.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/views/AuditLogView.tsx`
- Create: `src/commercialFlow.test.ts`

**Interfaces:**
- Consumes: shared App handlers for work-item resolution and audit logging.
- Produces: resolved work-item state, lightweight toast feedback, and matching audit events.

- [ ] **Step 1: Write a failing integration-contract test**

```ts
assert.equal(resolveLegacyView('afterSales'), 'exceptions');
assert.match(appSource, /handleResolveWorkItem/);
assert.match(appSource, /setToast/);
assert.doesNotMatch(systemSource, /alert\(`/);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --import tsx --test src/commercialFlow.test.ts`

Expected: FAIL because after-sales actions still rely on alerts and local-only state.

- [ ] **Step 3: Turn exceptions into a work-item queue**

Provide filters for unresolved/resolved items and types: credit compensation, credit clawback, code revocation, payment exception, and refund review. Confirmation copy must include the institution/student, amount or code, and resulting state change.

- [ ] **Step 4: Wire action closure through App**

`handleResolveWorkItem(id, resolution)` updates the relevant mock business object, records a fulfillment event/audit log, removes or resolves the dashboard work item, and emits a toast. Keep platform settings isolated from after-sales state.

- [ ] **Step 5: Replace success alerts in the edited commercial path**

Use a single `Toast` component with `success`, `warning`, and `error` variants. Browser-native confirmation remains only for risky refund/clawback actions.

- [ ] **Step 6: Run the complete automated verification**

Run: `node --import tsx --test src/*.test.ts src/components/views/*.test.ts src/components/institutions/*.test.ts && npm run lint && npm run build`

Expected: all tests PASS, TypeScript exits 0, Vite build exits 0.

- [ ] **Step 7: Walk the browser demo path**

Verify at the desktop viewport: cockpit → customer contract → catalog → generate opening code → finance ledger → resolve after-sales item → audit log. Confirm every navigation item renders, funnel clicks route correctly, no primary button is inert, and no main content is clipped or horizontally overflowing.

- [ ] **Step 8: Commit**

```bash
git add src/components/views/SystemView.tsx src/components/ui/Toast.tsx src/App.tsx src/components/views/AuditLogView.tsx src/commercialFlow.test.ts
git commit -m "feat: close commercial fulfillment demo workflow"
```

