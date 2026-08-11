# Refund and AI Usage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put full-refund actions directly on student AI add-on orders and make institution points, student service rights, and AI usage unambiguous throughout the admin UI.

**Architecture:** Introduce a focused student add-on order domain model whose pure functions decide eligibility and perform the refund transition. Render that state through a dedicated order panel inside `GoodsView`; normal refunds live there, while `SystemView` keeps only exceptional handling and audit. Remove student point allocation from the class-import workflow and replace customer-facing Token copy with AI usage terminology.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Node test runner through `tsx`, Vite 6.

## Global Constraints

- Institution points flow only from platform to institution to teacher.
- Students receive service rights and AI usage, never institution points.
- Customer-facing business pages use “AI 用量”; the technical term “Token” is not displayed.
- Only paid, not-yet-refunded orders with completely unused AI usage support original-channel full refunds.
- Partial refunds and automatic refunds after usage are out of scope and go to exceptional manual handling.
- One refund action must update the order, reclaim AI usage, create a refund ledger record, and create an audit event.

---

### Task 1: Define the student add-on order and refund transition

**Files:**
- Create: `src/domain/studentAddOnOrder.ts`
- Create: `src/domain/studentAddOnOrder.test.ts`
- Delete after migration: `src/utils/tokenRefund.ts`
- Delete after migration: `src/utils/tokenRefund.test.ts`

**Interfaces:**
- Produces: `StudentAddOnOrder`, `RefundResult`, `getRefundEligibility(order)`, and `refundStudentAddOnOrder(order, reason, now)`.
- Consumed by: the order panel in Task 2.

- [ ] **Step 1: Write failing eligibility tests**

```ts
test('allows a paid order when all AI usage remains', () => {
  assert.deepEqual(getRefundEligibility(paidOrder), { allowed: true, reason: '可原路全额退款' });
});

test('rejects an order after any AI usage has been consumed', () => {
  assert.deepEqual(
    getRefundEligibility({ ...paidOrder, remainingUsage: 800_000 }),
    { allowed: false, reason: '已使用 200,000 AI 用量，不可退款' },
  );
});

test('rejects an order that has already been refunded', () => {
  assert.equal(getRefundEligibility({ ...paidOrder, status: 'refunded' }).allowed, false);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test src/domain/studentAddOnOrder.test.ts`

Expected: FAIL because `studentAddOnOrder.ts` does not exist.

- [ ] **Step 3: Implement the domain types and eligibility function**

```ts
export type StudentAddOnOrderStatus = 'paid' | 'payment_failed' | 'refunded';

export interface StudentAddOnOrder {
  id: string;
  student: string;
  institution: string;
  packageName: string;
  channel: '微信支付' | '支付宝';
  paidAmount: number;
  grantedUsage: number;
  remainingUsage: number;
  status: StudentAddOnOrderStatus;
  orderedAt: string;
  refundedAt?: string;
  refundNo?: string;
  refundReason?: string;
}

export const getRefundEligibility = (order: StudentAddOnOrder) => {
  if (order.status === 'refunded') return { allowed: false, reason: '订单已退款' };
  if (order.status !== 'paid') return { allowed: false, reason: '支付未成功，无需退款' };
  const used = order.grantedUsage - order.remainingUsage;
  if (used > 0) return { allowed: false, reason: `已使用 ${used.toLocaleString('zh-CN')} AI 用量，不可退款` };
  return { allowed: true, reason: '可原路全额退款' };
};
```

- [ ] **Step 4: Add and test the atomic refund transition**

```ts
export interface RefundResult {
  order: StudentAddOnOrder;
  ledger: { id: string; orderId: string; amount: number; channel: string; reason: string; createdAt: string };
  audit: { action: '学生加油包退款'; target: string; details: string };
}

export function refundStudentAddOnOrder(order: StudentAddOnOrder, reason: string, now: string): RefundResult {
  const eligibility = getRefundEligibility(order);
  if (!eligibility.allowed) throw new Error(eligibility.reason);
  const refundNo = `RF-${order.id.replace('PAY-', '')}`;
  return {
    order: { ...order, status: 'refunded', remainingUsage: 0, refundedAt: now, refundNo, refundReason: reason },
    ledger: { id: refundNo, orderId: order.id, amount: order.paidAmount, channel: order.channel, reason, createdAt: now },
    audit: { action: '学生加油包退款', target: order.id, details: `原路退回 ¥${order.paidAmount}，收回 ${order.grantedUsage.toLocaleString('zh-CN')} AI 用量` },
  };
}
```

Test that the result contains the updated order, refund ledger, and audit event, and that an ineligible order throws its displayed reason.

- [ ] **Step 5: Run tests and commit**

Run: `npx tsx --test src/domain/studentAddOnOrder.test.ts`

Expected: PASS.

```bash
git add src/domain/studentAddOnOrder.ts src/domain/studentAddOnOrder.test.ts src/utils/tokenRefund.ts src/utils/tokenRefund.test.ts
git commit -m "feat: model student add-on refunds"
```

---

### Task 2: Build the inline refund order panel

**Files:**
- Create: `src/components/goods/StudentAddOnOrdersPanel.tsx`
- Create: `src/components/goods/StudentAddOnOrdersPanel.test.ts`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/views/GoodsView.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 1 domain types and refund functions.
- Produces: `StudentAddOnOrdersPanel({ onAudit, onNotify })` and a single normal-refund entry point.

- [ ] **Step 1: Write a failing render test for order actions and terminology**

```ts
test('renders refund action and explains ineligible orders without Token copy', () => {
  const markup = renderToStaticMarkup(createElement(StudentAddOnOrdersPanel, {
    onAudit: () => undefined,
    onNotify: () => undefined,
  }));
  assert.match(markup, /学生加油包订单/);
  assert.match(markup, /申请退款/);
  assert.match(markup, /已使用 .* AI 用量，不可退款/);
  assert.match(markup, /剩余 AI 用量/);
  assert.doesNotMatch(markup, /Token/i);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test src/components/goods/StudentAddOnOrdersPanel.test.ts`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the order table and confirmation dialog**

The table must render columns for order, student/institution, add-on, channel, amount, granted usage, remaining usage, status/time, and action. For an eligible order, render `申请退款`; for an ineligible order, render the exact eligibility reason. The dialog must show order ID, amount, original channel, reclaimed AI usage, and a required refund-reason field.

Use component state:

```ts
const [orders, setOrders] = useState<StudentAddOnOrder[]>(initialOrders);
const [refundLedgers, setRefundLedgers] = useState<RefundResult['ledger'][]>([]);
const [selectedOrder, setSelectedOrder] = useState<StudentAddOnOrder | null>(null);
const [refundReason, setRefundReason] = useState('');
```

On confirmation, call `refundStudentAddOnOrder`, replace the order by ID, prepend the ledger, call `onAudit(result.audit)`, show a success toast through `onNotify`, and close the dialog. Refunded rows show `refundedAt` and `refundNo`.

- [ ] **Step 4: Integrate the panel into GoodsView**

Replace the inline `initialStudentTokenOrders` table. Rename the tab to `学生加油包订单`; add GoodsView props:

```ts
onAudit: (event: { action: string; target: string; details: string }) => void;
onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
```

Wire them in `App.tsx` to `addAuditLog(..., '系统设置')` and `handleNotify`.

- [ ] **Step 5: Run focused tests and commit**

Run: `npx tsx --test src/components/goods/StudentAddOnOrdersPanel.test.ts src/components/views/GoodsView.test.ts`

Expected: PASS.

```bash
git add src/components/goods/StudentAddOnOrdersPanel.tsx src/components/goods/StudentAddOnOrdersPanel.test.ts src/components/views/GoodsView.tsx src/components/views/GoodsView.test.ts src/App.tsx
git commit -m "feat: add inline student add-on refunds"
```

---

### Task 3: Remove duplicate normal refunds from System Management

**Files:**
- Modify: `src/components/views/SystemView.tsx`
- Create: `src/components/views/SystemView.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: System Management containing rules, audit, compensation, and exceptional handling only.

- [ ] **Step 1: Write the failing system-boundary test**

```ts
test('system management does not duplicate products or normal refunds', () => {
  const markup = renderToStaticMarkup(createElement(SystemView, systemProps));
  assert.doesNotMatch(markup, /Token 加油包|学生加油包退款|全额退款/);
  assert.match(markup, /异常处理|审计/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test src/components/views/SystemView.test.ts`

Expected: FAIL because SystemView still renders duplicate add-on and refund tabs.

- [ ] **Step 3: Remove duplicated state and tabs**

Delete `initialStudentTokenPacks`, `initialRefundOrders`, `refundOrders`, `tokenPacks`, the `tokenPacks` tab, and the normal-refund table. Rename remaining customer-facing copy from Token to AI 用量. Keep `exceptionReversal` as “异常处理” with an explanatory empty/work-item surface; it must not execute routine refunds.

- [ ] **Step 4: Run the test and commit**

Run: `npx tsx --test src/components/views/SystemView.test.ts`

Expected: PASS.

```bash
git add src/components/views/SystemView.tsx src/components/views/SystemView.test.ts
git commit -m "refactor: keep normal refunds out of system management"
```

---

### Task 4: Remove student point allocation from class import

**Files:**
- Modify: `src/components/views/TeacherClassView.tsx`
- Modify: `src/teacherClass.test.ts`

**Interfaces:**
- Consumes: existing class and student types.
- Produces: imported students with class, institution, teacher, and `serviceStatus: 'none'`, but no allocated institution points.

- [ ] **Step 1: Write a failing import-boundary render test**

```ts
test('student import creates pending service records without point allocation copy', () => {
  const markup = renderToStaticMarkup(createElement(TeacherClassView, {
    institutions: initialInstitutions,
    initialTab: 'classes',
  }));
  assert.match(markup, /批量导入/);
  assert.doesNotMatch(markup, /每名学员划拨|初始划拨额度|学生.*点\/人|Token/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test src/teacherClass.test.ts`

Expected: FAIL because the class import modal still allocates default student points.

- [ ] **Step 3: Remove the student quota controls and state**

Delete `defaultQuota`, its numeric input, the allocation explanation, roster point-edit controls, and student-quota modal. During simulated import, create each student with class/institution/teacher responsibility and `serviceStatus: 'none'`; do not deduct teacher points and do not create a student point balance. Replace the explanation with: `导入只建立花名册和责任关系，学生服务需在“商品与权益”中另行开通。`

- [ ] **Step 4: Run the test and commit**

Run: `npx tsx --test src/teacherClass.test.ts`

Expected: PASS.

```bash
git add src/components/views/TeacherClassView.tsx src/teacherClass.test.ts
git commit -m "fix: stop allocating institution points to students"
```

---

### Task 5: Enforce terminology and complete verification

**Files:**
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/views/SystemView.tsx`
- Modify: `src/components/views/TeacherClassView.tsx`
- Modify: `src/components/modals/HelpModal.tsx`
- Modify: `src/types/index.ts`
- Create: `src/terminology.test.ts`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a customer-facing UI with one stable vocabulary.

- [ ] **Step 1: Write the failing terminology test**

Read the customer-facing source files and assert that they contain no `/Token/i`. Also assert that `GoodsView` contains `AI 加油包`, `AI 用量`, `机构点数`, and `学生权益`.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test src/terminology.test.ts`

Expected: FAIL with the remaining customer-facing Token occurrences.

- [ ] **Step 3: Rename UI-facing types and copy**

Rename `TokenTopUpPack` to `AiUsagePack`, `tokenAmount` to `usageAmount`, `tokenMultiplier` display copy to `AI 用量倍率`, and compensation copy to `AI 用量补发`. Internal provider/API terms may remain only where they are explicitly technical and not rendered to customers.

- [ ] **Step 4: Run the complete automated verification**

Run:

```bash
npx tsc --noEmit
npx tsx --test src/*.test.ts src/domain/*.test.ts src/components/goods/*.test.ts
npm run build
```

Expected: all tests pass and Vite produces `dist/` successfully.

- [ ] **Step 5: Verify the browser flow**

At `/platform/goods`, open “学生加油包订单”; confirm one unused paid order shows `申请退款`, one partially used order explains why it cannot be refunded, and a completed refund updates status, refund time, and refund number. Verify teacher/class/student pages show no Token wording and student import has no point allocation field.

- [ ] **Step 6: Commit and deploy**

```bash
git add src
git commit -m "refactor: unify AI usage terminology"
git push https://github.com/kessingye-gif/houtai.git HEAD:main
```

Confirm the GitHub Pages workflow concludes successfully and the published asset hash changes before reporting completion.
