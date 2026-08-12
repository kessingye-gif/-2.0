# Customer Demo Main Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除原型中的重复维护入口，并打通学生办理服务到双码和待激活权益的客户演示主线。

**Architecture:** 继续使用 React 根级状态作为原型数据源，新增纯函数产生一次办理的授权码、家长绑定码和权益结果。路由 state 传递学生办理上下文，商品与权益负责办理，学生管理负责展示。内容管理完全读取 `MasterDataProvider` 中的学科，不再维护本地学科。

**Tech Stack:** React 19, TypeScript, React Router, Node test runner via `tsx`, Vite.

## Global Constraints

- 这是客户演示原型；不新增后端、数据库、真实支付或完整 RBAC。
- 学科只能在“系统管理 → 基础数据”维护。
- 内容管理只保留内容包、知识点、题目。
- 一级命名为“章”，二级命名为“节”，只有第三级命名为“知识点”。
- 学生页不能直接生成授权码；必须进入商品与权益办理。
- 一次成功办理生成且仅生成一个学生授权码、一个家长绑定码和一条待激活权益。
- 使用页内结果和 toast，不新增阻塞式 `alert`。

---

### Task 1: 统一内容导航和三级术语

**Files:**
- Modify: `src/router/contentRoutes.ts`
- Modify: `src/components/views/QuestionBankView.tsx`
- Modify: `src/utils/dataSplitter.ts`
- Test: `src/router/contentRoutes.test.ts`
- Test: `src/utils/dataSplitter.test.ts`

**Interfaces:**
- Consumes: `MasterDataProvider` 中的启用学科。
- Produces: `ContentResourceTab = 'knowledge-points' | 'questions'`；内容页不再输出学科 CRUD。

- [ ] **Step 1: Write failing route and hierarchy tests**

```ts
test('内容默认进入知识点管理', () => {
  assert.deepEqual(getContentRouteState('/platform/content'), { section: 'resources', resource: 'knowledge-points' });
});

test('三级内容使用章节知识点术语', () => {
  assert.deepEqual(getKnowledgeHierarchyLabels(), ['章', '节', '知识点']);
});
```

- [ ] **Step 2: Run tests and verify expected failures**

Run: `npx tsx --test src/router/contentRoutes.test.ts src/utils/dataSplitter.test.ts`
Expected: default resource is `subjects` and hierarchy helper is missing.

- [ ] **Step 3: Implement routes, labels, and remove subject CRUD UI**

```ts
export type ContentResourceTab = 'knowledge-points' | 'questions';
export const getKnowledgeHierarchyLabels = () => ['章', '节', '知识点'] as const;
```

Remove subject modal/state/write handlers. Use active master subjects only as filters and ownership fields. Replace `一级知识领域/章节`, `二级核心专题`, and `三级考点` with `章`, `节`, and `知识点`.

- [ ] **Step 4: Run focused tests**

Run: `npx tsx --test src/router/contentRoutes.test.ts src/utils/dataSplitter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/router src/utils src/components/views/QuestionBankView.tsx
git commit -m "refactor: clarify content hierarchy"
```

### Task 2: 建立单次服务办理领域结果

**Files:**
- Create: `src/domain/serviceFulfillment.ts`
- Test: `src/domain/serviceFulfillment.test.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `StudentItem`, `ServicePackage`, operator context, current timestamp.
- Produces: `createServiceFulfillment(input): ServiceFulfillmentResult` containing `authCode`, `guardianBindingCode`, and `right`.

- [ ] **Step 1: Write failing pure-domain tests**

```ts
test('一次办理同时产生双码和待激活权益', () => {
  const result = createServiceFulfillment({ student, servicePackage, now: new Date('2026-08-12T10:00:00+08:00'), nonce: '1234' });
  assert.equal(result.authCode.studentId, 'STU-001');
  assert.equal(result.guardianBindingCode.studentId, 'STU-001');
  assert.equal(result.right.status, 'pending');
  assert.equal(result.right.packageName, '单科高量包');
});

test('停用服务包不能办理', () => {
  assert.throws(() => createServiceFulfillment({ student, servicePackage: { ...servicePackage, status: 'inactive' }, now, nonce: '1234' }), /服务包已停用/);
});
```

- [ ] **Step 2: Run test and verify missing-function failure**

Run: `npx tsx --test src/domain/serviceFulfillment.test.ts`
Expected: FAIL because module/function does not exist.

- [ ] **Step 3: Implement minimal deterministic fulfillment function**

Validate student organization/teacher and active package. Build stable demo codes from `now` and `nonce`; preserve package name, AI usage, points, duration and actor snapshots.

- [ ] **Step 4: Run focused test**

Run: `npx tsx --test src/domain/serviceFulfillment.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/serviceFulfillment.ts src/domain/serviceFulfillment.test.ts src/types/index.ts
git commit -m "feat: model service fulfillment result"
```

### Task 3: 连接学生入口与商品办理面板

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/views/StudentView.tsx`
- Modify: `src/components/views/GoodsView.tsx`
- Create: `src/components/fulfillment/ServiceFulfillmentPanel.tsx`
- Test: `src/components/views/GoodsView.test.ts`
- Test: `src/utils/studentCodeManagement.test.ts`

**Interfaces:**
- Consumes: route state `{ intent: 'fulfill-service', studentId: string }` and root shared collections.
- Produces: `onFulfill(result: ServiceFulfillmentResult)` which appends each result exactly once.

- [ ] **Step 1: Write failing component behavior tests**

```ts
test('带学生上下文时办理面板展示机构教师和学生', () => {
  const markup = renderGoods({ fulfillmentStudentId: 'STU-001' });
  assert.match(markup, /浙江大学附属中学/);
  assert.match(markup, /张老师/);
  assert.match(markup, /王小明/);
});
```

- [ ] **Step 2: Run focused tests and verify missing panel/context failure**

Run: `npx tsx --test src/components/views/GoodsView.test.ts src/utils/studentCodeManagement.test.ts`
Expected: FAIL because fulfillment student context is not rendered.

- [ ] **Step 3: Implement student CTA, route context, panel and root append**

Student roster CTA navigates to `/platform/goods/fulfillment` with student ID. Panel shows readonly student summary, active package cards, point/AI/duration summary and confirm button. Appends auth code, guardian code and right in one handler; renders an inline success result with copy controls and navigation back to the student rights tab.

- [ ] **Step 4: Run focused tests**

Run: `npx tsx --test src/components/views/GoodsView.test.ts src/utils/studentCodeManagement.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/views/StudentView.tsx src/components/views/GoodsView.tsx src/components/fulfillment src/components/views/GoodsView.test.ts src/utils/studentCodeManagement.test.ts
git commit -m "feat: connect student service fulfillment"
```

### Task 4: 统一服务权益展示和机构额度跳转

**Files:**
- Modify: `src/components/views/StudentView.tsx`
- Modify: `src/components/views/InstitutionView.tsx`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/views/GoodsView.test.ts`
- Test: `src/utils/studentCodeManagement.test.ts`

**Interfaces:**
- Consumes: shared fulfillment results and route intent for institution credit entry.
- Produces: readonly student service-right rows and prefilled credit-entry panel.

- [ ] **Step 1: Write failing tests for shared result and prefilled navigation**

Assert a newly created pending right is derived from the same auth-code ID and that institution credit intent selects the requested institution without another search.

- [ ] **Step 2: Run tests and verify failures**

Run: `npx tsx --test src/components/views/GoodsView.test.ts src/utils/studentCodeManagement.test.ts`
Expected: FAIL for missing shared relation/prefill.

- [ ] **Step 3: Implement readonly views and route prefill**

Rename `学生权益` to `服务权益`; remove direct generation controls from StudentView. Institution actions navigate to goods credit entry with institution ID; GoodsView opens the correct tab with the form prefilled.

- [ ] **Step 4: Run focused tests**

Run: `npx tsx --test src/components/views/GoodsView.test.ts src/utils/studentCodeManagement.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/views/StudentView.tsx src/components/views/InstitutionView.tsx src/components/views/GoodsView.tsx src/components/views/GoodsView.test.ts src/utils/studentCodeManagement.test.ts
git commit -m "refactor: make business ownership explicit"
```

### Task 5: 验证客户演示主线

**Files:**
- Modify if necessary: files touched in Tasks 1–4 only.

**Interfaces:**
- Consumes: completed UI and shared demo state.
- Produces: verified production build and deploy-ready main branch.

- [ ] **Step 1: Run the full automated suite**

Run: `npx tsx --test src/*.test.ts src/components/**/*.test.ts src/domain/*.test.ts src/router/*.test.ts src/utils/*.test.ts src/masterData/*.test.ts`
Expected: all tests pass.

- [ ] **Step 2: Run type and production checks**

Run: `npm run lint && npm run build`
Expected: both exit 0.

- [ ] **Step 3: Browser-test the demonstration path**

Verify: student roster → service fulfillment → package selection → dual-code success → student service rights. Also verify content navigation has only packages, knowledge points, and questions, and hierarchy labels are `章 / 节 / 知识点`.

- [ ] **Step 4: Inspect browser errors**

Expected: no console errors, no dead actions, and direct deep links work under the GitHub Pages basename.

- [ ] **Step 5: Commit any verification fixes**

```bash
git add src
git commit -m "fix: polish customer demo journey"
```
