# Unified Transaction Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the authorization-template tab and make one “交易流水” view that contains both institution asset records and student add-on orders.

**Architecture:** Keep `GoodsView` as the navigation owner and render a single transaction-ledger workspace for the finance route. Convert `StudentAddOnOrdersPanel` from a standalone tab into the student-order section within that workspace, preserving its self-contained order search and refund modal state. Keep the existing domain refund logic unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Node built-in test runner via `tsx`.

## Global Constraints

- The visible transaction label is exactly `交易流水`; do not expose `资产流水` or an independent `学生加油包订单` tab.
- Do not change the refund eligibility or refund domain functions in `src/domain/studentAddOnOrder.ts`.
- Preserve the existing institution offline-credit entry flow.

---

### Task 1: Turn the student-order panel into a reusable transaction-ledger section

**Files:**
- Modify: `src/components/goods/StudentAddOnOrdersPanel.tsx`
- Test: `src/components/goods/StudentAddOnOrdersPanel.test.ts`

**Interfaces:**
- Consumes: `onAudit(event: RefundAuditEvent)` and `onNotify(message, tone?)` from `GoodsView`.
- Produces: `StudentAddOnOrdersPanel`, rendered inside the transaction-ledger workspace and retaining the refund button and modal behavior.

- [ ] **Step 1: Write the failing test**

```ts
test('学生订单作为交易流水区块呈现，不再显示独立页标题', () => {
  const markup = renderToStaticMarkup(createElement(StudentAddOnOrdersPanel, {
    onAudit: () => undefined,
    onNotify: () => undefined,
  }));
  assert.match(markup, /学生加油包交易/);
  assert.doesNotMatch(markup, /<h3[^>]*>学生加油包订单<\/h3>/);
  assert.match(markup, /申请退款/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/goods/StudentAddOnOrdersPanel.test.ts`

Expected: FAIL because the component still renders the standalone `学生加油包订单` heading.

- [ ] **Step 3: Write minimal implementation**

Change the component heading to `学生加油包交易`, keep the table, order search, eligibility messages, refund confirmation modal, and audit callbacks unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/goods/StudentAddOnOrdersPanel.test.ts`

Expected: PASS with the transaction-section heading and existing refund coverage green.

- [ ] **Step 5: Commit**

```bash
git add src/components/goods/StudentAddOnOrdersPanel.tsx src/components/goods/StudentAddOnOrdersPanel.test.ts
git commit -m "refactor: embed student orders in transaction ledger"
```

### Task 2: Consolidate GoodsView navigation into one transaction ledger

**Files:**
- Modify: `src/components/views/GoodsView.tsx`
- Test: `src/components/views/GoodsView.test.ts`

**Interfaces:**
- Consumes: `StudentAddOnOrdersPanel` from Task 1 plus existing ledger state and credit-entry handlers.
- Produces: One `ledger` tab labeled `交易流水`; the ledger content contains both the existing institutional ledger table and `StudentAddOnOrdersPanel`.

- [ ] **Step 1: Write the failing test**

```ts
test('交易流水合并机构资产记录与学生加油包交易', () => {
  const markup = renderMode('finance');
  assert.match(markup, />交易流水</);
  assert.doesNotMatch(markup, />资产流水</);
  assert.doesNotMatch(markup, />学生加油包订单</);
  assert.doesNotMatch(markup, /授权模板/);
  assert.match(markup, /录入线下入账/);
  assert.match(markup, /学生加油包交易/);
  assert.match(markup, /申请退款/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/views/GoodsView.test.ts`

Expected: FAIL because the current finance navigation has separate `资产流水` and `学生加油包订单` buttons, and catalog still shows `授权模板`.

- [ ] **Step 3: Write minimal implementation**

In `GoodsView.tsx`, remove `cooperationPlans` and `addOnOrders` from the active-tab union, imports, tab arrays, and conditional tab renders. Rename the remaining `ledger` label to `交易流水` in catalog and finance modes. Render `StudentAddOnOrdersPanel` below the existing institutional ledger table when `activeTab === 'ledger'`; leave the offline-credit modal and its state as-is.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/views/GoodsView.test.ts`

Expected: PASS, including the existing catalog, fulfillment, credit-entry, and new unified-ledger assertions.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/GoodsView.tsx src/components/views/GoodsView.test.ts
git commit -m "feat: unify transaction ledger"
```

### Task 3: Run regression and production checks

**Files:**
- Verify only: `src/**/*.test.ts`, TypeScript project configuration, Vite build configuration.

**Interfaces:**
- Consumes: completed Tasks 1–2.
- Produces: validated application behavior with no type or production-build regressions.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: PASS with all component and domain tests green.

- [ ] **Step 2: Run type checking**

Run: `npm run lint`

Expected: PASS with no TypeScript diagnostics.

- [ ] **Step 3: Build the application**

Run: `npm run build`

Expected: PASS and Vite emits the production `dist` assets.

- [ ] **Step 4: Commit any verification-driven correction**

```bash
git add src/components/goods/StudentAddOnOrdersPanel.tsx src/components/goods/StudentAddOnOrdersPanel.test.ts src/components/views/GoodsView.tsx src/components/views/GoodsView.test.ts
git commit -m "fix: verify unified transaction ledger"
```

Only create this commit if a verification failure required a source or test correction.

## Self-review

- Spec coverage: Task 2 removes the authorization-template and student-order tabs, renames the transaction entry, and preserves the offline-credit flow. Task 1 preserves order search/refund behavior in the embedded section. Task 3 verifies both UI render behavior and project health.
- Placeholder scan: no `TBD`, `TODO`, or implicit test steps remain.
- Type consistency: `StudentAddOnOrdersPanel` keeps its existing props, and `GoodsView` remains its only consumer in this flow.
