# Commercial Institution Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move institution creation, platform authorization, lifecycle control, and platform credit allocation into 商品与权益 while reducing 机构管理 to reusable institution-internal operations.

**Architecture:** Keep the prototype as a React modular monolith with root-owned shared state in `App.tsx`. Introduce a pure commercial onboarding function and focused goods components so institution creation, authorization, credit entry, and ledgers are one atomic UI action; make `InstitutionView` consume the resulting institution data without commercial mutation callbacks.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Tailwind CSS 4, Node test runner through `tsx`, Vite 6.

## Global Constraints

- Platform commercial actions have one write entry under 商品与权益.
- 机构管理 must remain reusable for a future institution-admin console.
- Institution, teacher, student, authorization, credit, and code screens consume shared root state.
- Historical transaction and authorization labels remain snapshots after product edits or deactivation.
- The prototype adds no backend, payment gateway, full RBAC, or server-side tenancy in this phase.
- Use the repository's existing spacing, colors, dialog primitives, toasts, and table language.

---

### Task 1: Commercial onboarding domain transaction

**Files:**
- Create: `src/domain/institutionCommercial.ts`
- Test: `src/domain/institutionCommercial.test.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `Institution`, `CreditEntryRecord`, `OrderLedgerRecord`, content package IDs, service package IDs, and cooperation-plan metadata.
- Produces: `createInstitutionCommercialOnboarding(input): InstitutionCommercialOnboardingResult` containing one institution, one credit entry, one transaction record, and one asset ledger record.

- [ ] **Step 1: Write the failing tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstitutionCommercialOnboarding } from './institutionCommercial';

test('creates institution, authorization snapshot, credit entry and ledgers together', () => {
  const result = createInstitutionCommercialOnboarding({
    institution: {
      name: '新机构', code: 'INS-NEW', region: 'huadong', regionName: '华东地区',
      contactPerson: '王老师', phone: '13800000000', email: 'admin@example.com',
      adminAccount: 'admin_new', adminPassword: '123456', status: 'active',
    },
    contentPackageIds: ['CP-MATH'], servicePackageIds: ['PKG-001'],
    cooperationPlanId: 'PLAN-01', cooperationDurationDays: 365,
    paymentAmount: 10000, allocatedCredits: 10000, voucherNo: 'PAY-001',
    now: new Date('2026-08-13T10:00:00+08:00'), nonce: '1001',
  });
  assert.equal(result.institution.remainingQuota, 10000);
  assert.deepEqual(result.institution.availableContentPackages, ['CP-MATH']);
  assert.deepEqual(result.institution.availableServicePackageIds, ['PKG-001']);
  assert.equal(result.creditEntry.allocatedCredits, 10000);
  assert.equal(result.transaction.type, 'institution_onboarding');
  assert.equal(result.assetLedger.creditChange, 10000);
});

test('rejects onboarding without authorization or with negative credits', () => {
  assert.throws(() => createInstitutionCommercialOnboarding({
    institution: { name: '错误机构', code: 'INS-BAD', region: 'huadong', regionName: '华东地区', contactPerson: '王老师', phone: '13800000000', email: 'bad@example.com', adminAccount: 'bad', adminPassword: '123456', status: 'active' },
    contentPackageIds: [], servicePackageIds: [], cooperationDurationDays: 365,
    paymentAmount: 0, allocatedCredits: -1, voucherNo: '',
    now: new Date('2026-08-13T10:00:00+08:00'), nonce: '1002',
  }), /点数/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --import tsx --test src/domain/institutionCommercial.test.ts`

Expected: FAIL because `institutionCommercial.ts` does not exist.

- [ ] **Step 3: Add commercial record types and the pure transaction**

```ts
export interface CommercialTransactionRecord extends Omit<OrderLedgerRecord, 'type'> {
  type: OrderLedgerRecord['type'] | 'institution_onboarding' | 'authorization_change';
  businessResult: string;
}

export interface InstitutionAssetLedgerRecord {
  id: string;
  institutionId: string;
  institutionName: string;
  businessNo: string;
  direction: 'in' | 'out';
  creditChange: number;
  balanceAfter: number;
  reason: string;
  timestamp: string;
}
```

Implement `createInstitutionCommercialOnboarding` as a pure function that validates positive duration and non-negative amounts, requires at least one authorized content or service package, builds stable IDs from `nonce`, and returns all records without mutating input.

- [ ] **Step 4: Run domain tests**

Run: `node --import tsx --test src/domain/institutionCommercial.test.ts src/domain/cooperationPlan.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the domain slice**

```bash
git add src/types/index.ts src/domain/institutionCommercial.ts src/domain/institutionCommercial.test.ts
git commit -m "feat: add institution commercial onboarding transaction"
```

### Task 2: Institution opening and authorization workspace

**Files:**
- Create: `src/components/goods/InstitutionAuthorizationPanel.tsx`
- Create: `src/components/goods/InstitutionAuthorizationPanel.test.ts`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/ui/FormPrimitives.tsx`

**Interfaces:**
- Consumes: institutions, cooperation plans, content packages, service packages, and callbacks `onCreateInstitutionCommercial`, `onUpdateInstitutionAuthorization`, `onUpdateInstitutionStatus`.
- Produces: the `institutionAuthorization` goods tab with list, filters, detail summary, onboarding dialog, authorization dialog, renewal, and platform lifecycle actions.

- [ ] **Step 1: Write the failing component contract test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('commercial panel owns onboarding and platform authorization copy', () => {
  const source = readFileSync('src/components/goods/InstitutionAuthorizationPanel.tsx', 'utf8');
  assert.match(source, /新建机构合作/);
  assert.match(source, /授权内容包/);
  assert.match(source, /授权服务包/);
  assert.match(source, /首次划拨点数/);
  assert.match(source, /续期/);
  assert.match(source, /停用/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --import tsx --test src/components/goods/InstitutionAuthorizationPanel.test.ts`

Expected: FAIL because the panel does not exist.

- [ ] **Step 3: Build the focused panel**

Create a clean table whose columns are `机构与状态 / 授权范围 / 点数资产 / 合作期限 / 操作`. Add one primary action, `新建机构合作`. Use `DialogShell`, `ChoiceCard`, and existing input styles for a five-section dialog: institution data, administrator account, authorization, cooperation/payment, and confirmation summary.

```tsx
<InstitutionAuthorizationPanel
  institutions={institutions}
  plans={cooperationPlans}
  contentPackages={contentPackages}
  servicePackages={packages}
  onCreate={onCreateInstitutionCommercial}
  onUpdateAuthorization={onUpdateInstitutionAuthorization}
  onUpdateStatus={onUpdateInstitutionStatus}
/>
```

Disable submission when required identity fields are empty, both authorization lists are empty, duration is not positive, or allocated credits are negative. Show the reason next to the confirmation button rather than using `alert`.

- [ ] **Step 4: Register the goods tab and run tests**

Add `{ id: 'institutionAuthorization', label: '机构开通与授权' }` after AI usage packs and make it the ownership point for onboarding and platform authorization.

Run: `node --import tsx --test src/components/goods/InstitutionAuthorizationPanel.test.ts src/components/views/GoodsView.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the commercial UI slice**

```bash
git add src/components/goods/InstitutionAuthorizationPanel.tsx src/components/goods/InstitutionAuthorizationPanel.test.ts src/components/views/GoodsView.tsx src/components/ui/FormPrimitives.tsx
git commit -m "feat: move institution onboarding into goods"
```

### Task 3: Root shared-state integration and audit ownership

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/commercialFlow.test.ts`
- Modify: `src/components/views/GoodsView.tsx`

**Interfaces:**
- Consumes: `createInstitutionCommercialOnboarding` from Task 1 and commercial panel callbacks from Task 2.
- Produces: root handlers that atomically update institutions, credit entries, transaction records, asset ledgers, dashboard counts, and audit history.

- [ ] **Step 1: Extend the failing commercial flow test**

```ts
test('goods view receives institution commercial mutations while institution view does not', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  const goodsBlock = app.slice(app.indexOf('<GoodsView'), app.indexOf('/>', app.indexOf('<GoodsView')));
  const institutionBlock = app.slice(app.indexOf('<InstitutionView'), app.indexOf('/>', app.indexOf('<InstitutionView')));
  assert.match(goodsBlock, /onCreateInstitutionCommercial/);
  assert.match(goodsBlock, /onUpdateInstitutionAuthorization/);
  assert.doesNotMatch(institutionBlock, /onAddInstitution|onAdjustQuota|onCreditEntry/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test src/commercialFlow.test.ts`

Expected: FAIL because commercial callbacks have not moved.

- [ ] **Step 3: Wire atomic state updates**

Replace the standalone platform onboarding path with a handler shaped as:

```ts
const handleCreateInstitutionCommercial = (input: InstitutionCommercialOnboardingInput) => {
  const result = createInstitutionCommercialOnboarding(input);
  setInstitutions((current) => [result.institution, ...current]);
  setCreditEntries((current) => [result.creditEntry, ...current]);
  setCommercialTransactions((current) => [result.transaction, ...current]);
  setInstitutionAssetLedger((current) => [result.assetLedger, ...current]);
  addAuditLog('新建机构合作', result.institution.name, result.transaction.businessResult, '商品与权益');
};
```

Lift credit-entry and ledger state out of `GoodsView` so onboarding, later deposits, table views, and institution summaries use one root-owned source. Change platform authorization and lifecycle audit module names from `机构管理` to `商品与权益`.

- [ ] **Step 4: Run integration tests**

Run: `node --import tsx --test src/commercialFlow.test.ts src/navigation.test.ts src/components/views/GoodsView.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit shared-state integration**

```bash
git add src/App.tsx src/commercialFlow.test.ts src/components/views/GoodsView.tsx
git commit -m "refactor: centralize institution commercial state"
```

### Task 4: Reusable institution-internal management view

**Files:**
- Modify: `src/components/views/InstitutionView.tsx`
- Modify: `src/components/views/InstitutionView.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: institutions as read-only platform-provided organization context plus internal-management navigation actions.
- Produces: an institution overview without platform onboarding, authorization, deposit, quota-total mutation, lifecycle, or platform credential administration.

- [ ] **Step 1: Replace tests with the new ownership assertions**

```ts
test('institution view exposes internal operations only', () => {
  const source = readFileSync('src/components/views/InstitutionView.tsx', 'utf8');
  assert.match(source, /教师管理/);
  assert.match(source, /班级管理/);
  assert.match(source, /学生管理/);
  assert.match(source, /内部额度使用/);
  assert.doesNotMatch(source, /新增机构|新增接入机构|配置授权范围|机构额度入账|划拨\/调整机构采购额度|停用机构/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test src/components/views/InstitutionView.test.ts`

Expected: FAIL because the commercial controls still exist.

- [ ] **Step 3: Remove commercial mutations and simplify the screen**

Delete add/edit onboarding dialogs, platform authorization dialog, quota-total adjustment dialog, credential dialog, batch-import action, authorization and deposit row actions, and lifecycle toggles. Keep a compact institution selector/summary showing current institution, teacher count, class/student entry points, remaining internal assignable points, and read-only authorized scope.

Use links or callbacks to existing `/platform/teachers`, `/platform/classes`, and `/platform/students` pages. The only quota-writing operation reachable from the internal journey remains institution-to-teacher allocation on teacher management.

- [ ] **Step 4: Run institution and credit-flow tests**

Run: `node --import tsx --test src/components/views/InstitutionView.test.ts src/domain/teacherCredits.test.ts src/teacherClass.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the reusable internal view**

```bash
git add src/components/views/InstitutionView.tsx src/components/views/InstitutionView.test.ts src/App.tsx
git commit -m "refactor: limit institution management to internal operations"
```

### Task 5: Navigation language, transaction/asset views, and release verification

**Files:**
- Modify: `src/router/platformRoutes.ts`
- Modify: `src/navigation.test.ts`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/views/GoodsView.test.ts`
- Modify: `src/index.css` only if responsive overflow requires a local fix.

**Interfaces:**
- Consumes: root-owned commercial transactions and institution asset ledger.
- Produces: final 商品与交易 navigation and distinct `交易记录 / 资产流水 / 交易异常` tabs.

- [ ] **Step 1: Write failing navigation and tab assertions**

```ts
test('commercial navigation uses 商品与交易 and separates transaction from asset meaning', () => {
  assert.equal(getPlatformRoute('goods').label, '商品与交易');
  const source = readFileSync('src/components/views/GoodsView.tsx', 'utf8');
  for (const label of ['交易记录', '资产流水', '交易异常']) assert.match(source, new RegExp(label));
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --import tsx --test src/navigation.test.ts src/components/views/GoodsView.test.ts`

Expected: FAIL because the current label is 商品与权益 and ledger concepts are combined.

- [ ] **Step 3: Apply final information architecture**

Rename the route label to `商品与交易`. Set tabs in this order: `服务包商品 / AI 用量包商品 / 机构开通与授权 / 交易记录 / 资产流水 / 交易异常`. Keep authorization-code history accessible from a transaction detail or a compact secondary record section rather than promoting another competing primary tab.

Transaction records answer “发生了什么业务”; asset records answer “谁的点数为什么变化”; exception records show reversed or failed business records with a recovery action. On narrow screens, allow the tab row and tables to scroll horizontally without clipping actions.

- [ ] **Step 4: Run all verification**

Run: `node --import tsx --test src/*.test.ts src/**/*.test.ts`

Expected: all tests PASS.

Run: `npm run lint`

Expected: TypeScript exits 0.

Run: `npm run build`

Expected: Vite production build exits 0; a chunk-size warning is acceptable.

- [ ] **Step 5: Perform browser acceptance**

Open `/platform/goods` and verify onboarding creates a visible institution with authorization and credit data. Open `/platform/institutions` and verify no platform commercial control remains; navigate to teachers and verify institution-to-teacher allocation still works. Check desktop width near 1440 px and narrow width near 390 px.

- [ ] **Step 6: Commit the completed migration**

```bash
git add src/router/platformRoutes.ts src/navigation.test.ts src/components/views/GoodsView.tsx src/components/views/GoodsView.test.ts src/index.css
git commit -m "feat: complete commercial and institution boundary migration"
```
