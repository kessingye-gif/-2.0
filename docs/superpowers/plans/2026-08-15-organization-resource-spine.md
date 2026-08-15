# Organization Resource Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the institution the single operational hub for accounts, resource scope, quota changes, and their traceable history.

**Architecture:** Keep the current React modular-monolith prototype, but move institution resource mutations behind small domain functions instead of changing balances in page components. The institution detail page becomes the single management surface; the dashboard and transaction views consume the same derived records rather than duplicating counts.

**Tech Stack:** React 19, TypeScript, React Router, Vite, Node test runner via `tsx`.

## Global Constraints

- Preserve existing role data scopes: platform sees all, institution administrators see their own institution, teachers see their own responsibility scope.
- Keep historical transaction records immutable; mistakes add a reversal record instead of editing old records.
- Do not introduce a backend or database in this phase; use typed in-memory application state and isolate the future persistence boundary.
- Do not duplicate institution metrics on the institution list and dashboard.

---

### Task 1: Establish institution resource records as the source of truth

**Files:**
- Create: `src/domain/institutionResources.ts`
- Create: `src/domain/institutionResources.test.ts`
- Modify: `src/types/index.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces `createInstitutionCreditEntry(input)` and `reverseInstitutionCreditEntry(input)`.
- Produces `InstitutionCreditEntry` with `draft | posted | reversed` status and immutable amount, point, operator, reason, timestamp fields.
- Consumes `Institution` and returns the updated institution plus an `OrderLedgerRecord`.

- [ ] **Step 1: Write failing credit-entry and reversal tests**

```ts
test('posted credit entry increases institution quota and creates one ledger record', () => {
  const result = createInstitutionCreditEntry({ institution, paymentAmount: 50000, credits: 80000, voucherNo: 'BANK-001', operatorName: '超级管理员', now });
  assert.equal(result.institution.remainingQuota, institution.remainingQuota + 80000);
  assert.equal(result.ledger.type, 'credit_inflow');
  assert.equal(result.entry.status, 'posted');
});

test('reversal never edits the original entry', () => {
  const result = reverseInstitutionCreditEntry({ institution: posted.institution, original: posted.entry, operatorName: '超级管理员', reason: '重复录入', now });
  assert.equal(posted.entry.status, 'posted');
  assert.equal(result.entry.status, 'reversed');
  assert.equal(result.ledger.type, 'reversal');
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/domain/institutionResources.test.ts`

Expected: failure because the domain module does not exist.

- [ ] **Step 3: Add typed resource-entry models and domain functions**

```ts
export interface InstitutionCreditEntry {
  id: string;
  institutionId: string;
  paymentAmount: number;
  creditAmount: number;
  voucherNo: string;
  status: 'posted' | 'reversed';
  createdAt: string;
  operatorName: string;
  reversalOf?: string;
}
```

Validate positive amounts, a known institution, a non-empty voucher number, and prevent a second reversal of the same source entry.

- [ ] **Step 4: Replace direct quota mutation for line-item entries in `App.tsx`**

Use `createInstitutionCreditEntry` to update the institution, append the entry and append its ledger record in one handler. Keep generic quota adjustment separate and label it as an administrative correction.

- [ ] **Step 5: Run all tests and commit**

Run: `npm test && npm run lint`

Commit: `feat: centralize institution credit entries`

### Task 2: Make institution detail the resource-management hub

**Files:**
- Modify: `src/components/views/InstitutionView.tsx`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes `onCreateCreditEntry(input)` from `App.tsx`.
- Produces an in-context credit-entry panel opened from the institution detail action card.
- Removes the cross-module redirect carrying `credit-entry` intent.

- [ ] **Step 1: Write a component rendering test for the action hierarchy**

```ts
assert.match(markup, /开通与配置/);
assert.match(markup, /额度账户/);
assert.match(markup, /内容与服务授权/);
assert.match(markup, /管理员账号/);
assert.doesNotMatch(markup, /录入线下入账 →/);
```

- [ ] **Step 2: Run the test to verify the legacy cross-module entry remains**

Run: `npm test -- src/components/views/InstitutionView.test.ts`

Expected: failure until the test fixture and view support the new in-context entry.

- [ ] **Step 3: Add an in-detail “录入线下入账” modal**

Preselect the opened institution. Require amount, credit amount, voucher number and note. Show the resulting quota change before submitting. On success, close the modal and keep the detail drawer open with refreshed balances.

- [ ] **Step 4: Remove the `credit-entry` navigation intent**

Delete `handleStartCreditEntry`, `creditInstitutionId`, and the redirect-only entry from `GoodsView`. Keep the ledger page as a read/search/reversal surface.

- [ ] **Step 5: Run all tests and commit**

Run: `npm test && npm run lint && npm run build`

Commit: `refactor: keep institution credit entry in context`

### Task 3: Align dashboard and transaction figures to shared records

**Files:**
- Modify: `src/dashboardSnapshot.ts`
- Modify: `src/dashboardSnapshot.test.ts`
- Modify: `src/components/views/DashboardView.tsx`
- Modify: `src/components/views/GoodsView.tsx`

**Interfaces:**
- Dashboard receives institutions, students, credit entries and ledger records.
- Platform cards distinguish `机构学生总数` from `服务中学生`; they may not reuse `Institution.studentCount` under the latter label.

- [ ] **Step 1: Write failing metric-source tests**

```ts
assert.equal(metrics.find((item) => item.id === 'institutionStudents')?.value, students.length);
assert.equal(metrics.find((item) => item.id === 'activeStudents')?.value, students.filter((item) => item.serviceStatus === 'active').length);
```

- [ ] **Step 2: Implement exact labels and data sources**

Use the student collection for people counts, credit-entry records for line-item totals, and ledger records for transaction exceptions. Keep the metric source label and definition visible on each card.

- [ ] **Step 3: Add transaction traceability**

Display voucher number and related credit-entry ID in the ledger detail row. A reversal row references the original entry and its source order number.

- [ ] **Step 4: Run all tests and commit**

Run: `npm test && npm run lint && npm run build`

Commit: `fix: align dashboard metrics with resource records`

### Task 4: Define the next two delivery slices before expanding implementation

**Files:**
- Create: `docs/superpowers/plans/2026-08-15-teacher-service-spine.md`
- Create: `docs/superpowers/plans/2026-08-15-student-feedback-spine.md`

**Interfaces:**
- Teacher plan consumes institution scope and teacher quota records from Tasks 1–3.
- Student plan consumes active service rights and learning records from the teacher-service plan.

- [ ] **Step 1: Document teacher-service slice**

Define the single flow: teacher selects owned student(s), selects an institution-authorized service package, confirms quota impact, and receives immutable service/right records.

- [ ] **Step 2: Document student-feedback slice**

Define the single flow: active student service produces learning events, diagnostic aggregates, actionable teacher follow-up, and dashboard metrics.

- [ ] **Step 3: Commit the two plan documents**

Commit: `docs: plan teacher service and student feedback slices`

## Self-review

- The first phase only changes the institution-resource journey and its reporting; it does not redesign teacher or student pages.
- Every quota-affecting action is represented by an immutable entry and a linked ledger row.
- Existing role scopes remain intact, with no new backend assumptions.
- The plan intentionally defers approval workflow, file upload, real authentication, and database persistence until the core record boundaries are stable.
