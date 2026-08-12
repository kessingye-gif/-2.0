# Institution Cooperation Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以机构合作方案为唯一授权模板，打通方案创建、机构开通、机构工作台和跨模块上下文跳转。

**Architecture:** 继续使用 React 根级共享状态模拟原型数据。将内容包目录提升到 `App`，合作方案通过内容包 ID 和服务包 ID 引用共享目录；机构保存方案版本快照与实际授权范围，页面只展示或调整归属自身的数据。

**Tech Stack:** React 19, TypeScript, React Router, Node test runner via `tsx`, Vite.

## Global Constraints

- 第三轮只完善超级管理员主链。
- 机构不能默认拥有全部内容包或服务包。
- 新商品不能自动授权给已有机构。
- 内容包与服务包统一组成机构合作方案，界面内分别展示教学内容和服务权益。
- 学科、学段、年级和教材版本继续读取系统基础数据。
- 所有跨模块操作必须携带机构或学生上下文。
- 不新增后端、数据库、真实支付和复杂审批。
- 不使用阻塞式成功 `alert`。
- 不提交本轮代码，由用户统一提交。

---

### Task 1: 提升内容包目录并建立合作方案领域模型

**Files:**
- Create: `src/domain/cooperationPlan.ts`
- Create: `src/domain/cooperationPlan.test.ts`
- Modify: `src/types/index.ts`
- Modify: `src/mockData.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/views/QuestionBankView.tsx`

**Interfaces:**
- Produces: `CooperationPlan`, `InstitutionAgreement`, `validateCooperationPlan(plan, catalogs)` and root-owned `ContentPackageItem[]`.
- Consumes: `ServicePackage[]`, published `ContentPackageItem[]`.

- [ ] **Step 1: Write failing validation tests**

```ts
test('启用方案必须明确选择内容包和服务包', () => {
  assert.equal(validateCooperationPlan({ ...plan, contentPackageIds: [] }, catalogs), '至少选择一个内容包');
  assert.equal(validateCooperationPlan({ ...plan, servicePackageIds: [] }, catalogs), '至少选择一个服务包');
});

test('停用商品不能加入新方案', () => {
  assert.match(validateCooperationPlan(plan, catalogsWithInactivePackage) || '', /已停用/);
});
```

- [ ] **Step 2: Run tests and verify the missing module failure**

Run: `npx tsx --test src/domain/cooperationPlan.test.ts`
Expected: FAIL because `cooperationPlan.ts` does not exist.

- [ ] **Step 3: Implement types, validation, seed plans and shared content catalog**

```ts
export interface CooperationPlan {
  id: string;
  code: string;
  name: string;
  contentPackageIds: string[];
  servicePackageIds: string[];
  suggestedInitialQuota: number;
  cooperationDurationDays: number;
  status: 'draft' | 'active' | 'inactive';
  version: number;
  institutionCount: number;
  createdAt: string;
  updatedAt: string;
}
```

Move `initialContentPackages` to `mockData.ts`, keep `QuestionBankView` as an editor through `contentPackages` and `onChangeContentPackages` props, and store the catalog in `App`.

- [ ] **Step 4: Run focused tests and type check**

Run: `npx tsx --test src/domain/cooperationPlan.test.ts && npm run lint`
Expected: PASS.

### Task 2: 新增合作方案管理页签

**Files:**
- Create: `src/components/cooperation/CooperationPlanPanel.tsx`
- Create: `src/components/cooperation/CooperationPlanPanel.test.ts`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/views/GoodsView.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `plans`, `contentPackages`, `servicePackages`.
- Produces: `onAddPlan(input)` and `onUpdatePlan(id, changes)`.

- [ ] **Step 1: Write failing render and validation tests**

```ts
test('合作方案卡片同时展示教学内容和服务权益', () => {
  const markup = renderPlanPanel();
  assert.match(markup, /教学内容/);
  assert.match(markup, /服务权益/);
  assert.match(markup, /初中理科标准方案/);
});
```

- [ ] **Step 2: Run tests and verify missing panel failure**

Run: `npx tsx --test src/components/cooperation/CooperationPlanPanel.test.ts`
Expected: FAIL because the component is missing.

- [ ] **Step 3: Implement list and five-section editor**

The editor uses active published content packages and active service packages only. The primary action is `新建合作方案`; save remains disabled until validation succeeds. Cards show plan version, institution count, selected content/service counts, suggested quota and status.

- [ ] **Step 4: Wire GoodsView tab and root handlers**

Add `cooperationPlans` tab before service packages. Preserve existing goods modes and open the plan tab when route state intent is `manage-cooperation-plans`.

- [ ] **Step 5: Run focused tests and type check**

Run: `npx tsx --test src/components/cooperation/CooperationPlanPanel.test.ts src/components/views/GoodsView.test.ts && npm run lint`
Expected: PASS.

### Task 3: 将新增机构改为合作方案向导

**Files:**
- Create: `src/components/institutions/InstitutionOnboardingWizard.tsx`
- Create: `src/components/institutions/InstitutionOnboardingWizard.test.ts`
- Modify: `src/components/views/InstitutionView.tsx`
- Modify: `src/components/views/InstitutionView.test.ts`
- Modify: `src/types/index.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: active `CooperationPlan[]`, content and service catalogs.
- Produces: `onComplete({ institution, agreement })` with a plan version snapshot and explicit actual authorization IDs.

- [ ] **Step 1: Write failing onboarding tests**

```ts
test('没有合作方案不能完成机构创建', () => {
  assert.match(renderWizard({ plans: [] }), /请先创建并启用合作方案/);
});

test('选择方案后自动带出授权摘要', () => {
  const markup = renderWizard({ initialStep: 'authorization', selectedPlanId: 'PLAN-001' });
  assert.match(markup, /教学内容 3 个/);
  assert.match(markup, /服务权益 2 个/);
});
```

- [ ] **Step 2: Run tests and verify missing wizard failure**

Run: `npx tsx --test src/components/institutions/InstitutionOnboardingWizard.test.ts`
Expected: FAIL because the component is missing.

- [ ] **Step 3: Implement four steps and explicit overrides**

Use steps `basic → plan → authorization → account`. Selecting a plan copies IDs into the institution agreement draft. Overrides display added/removed differences and never mutate the plan.

- [ ] **Step 4: Replace the old add modal and wire root append**

After completion, append both institution and agreement, show a toast, and navigate to `/platform/institutions/:id`.

- [ ] **Step 5: Run focused tests and type check**

Run: `npx tsx --test src/components/institutions/InstitutionOnboardingWizard.test.ts src/components/views/InstitutionView.test.ts && npm run lint`
Expected: PASS.

### Task 4: 建立机构工作台与履约下一步

**Files:**
- Create: `src/domain/institutionJourney.ts`
- Create: `src/domain/institutionJourney.test.ts`
- Create: `src/components/institutions/InstitutionWorkspace.tsx`
- Create: `src/components/institutions/InstitutionWorkspace.test.ts`
- Modify: `src/components/views/InstitutionView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `deriveInstitutionNextAction({ institution, agreement, teachers, students }): InstitutionNextAction`.
- Consumes: institution, agreement, credit balance, teacher count and student count.

- [ ] **Step 1: Write failing journey-state tests**

```ts
test('已授权但未入账的机构下一步是额度入账', () => {
  assert.equal(deriveInstitutionNextAction(input).id, 'credit-entry');
});

test('有额度但没有老师的机构下一步是导入老师', () => {
  assert.equal(deriveInstitutionNextAction(fundedInput).id, 'import-teachers');
});
```

- [ ] **Step 2: Run tests and verify missing function failure**

Run: `npx tsx --test src/domain/institutionJourney.test.ts`
Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement next-action derivation and workspace**

Workspace sections are overview, cooperation plan, organization, credits and audit. The overview has one highlighted next action based on the derived journey stage.

- [ ] **Step 4: Replace the old detail drawer**

Route institution names and onboarding success to the workspace. Keep rare account/status operations within the workspace secondary actions.

- [ ] **Step 5: Run focused tests and type check**

Run: `npx tsx --test src/domain/institutionJourney.test.ts src/components/institutions/InstitutionWorkspace.test.ts && npm run lint`
Expected: PASS.

### Task 5: 统一跨模块机构上下文

**Files:**
- Create: `src/router/workContext.ts`
- Create: `src/router/workContext.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/institutions/InstitutionWorkspace.tsx`
- Modify: `src/components/views/TeacherClassView.tsx`
- Modify: `src/components/views/StudentView.tsx`
- Modify: `src/components/views/GoodsView.tsx`

**Interfaces:**
- Produces: `WorkContext = { institutionId?: string; studentId?: string; intent?: WorkIntent }` and `getWorkContext(location.state)`.
- Consumes: workspace navigation actions.

- [ ] **Step 1: Write failing context tests**

```ts
test('机构上下文只保留合法业务字段', () => {
  assert.deepEqual(getWorkContext({ institutionId: 'INS-1', intent: 'students', ignored: true }), {
    institutionId: 'INS-1', intent: 'students',
  });
});
```

- [ ] **Step 2: Run tests and verify missing helper failure**

Run: `npx tsx --test src/router/workContext.test.ts`
Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement route context and prefilter consumers**

Teacher, class and student views initialize their institution filter from route context. Goods credit entry and student fulfillment continue to use the same context type.

- [ ] **Step 4: Add workspace navigation actions**

Actions navigate with explicit intents: `credit-entry`, `teachers`, `classes`, `students`, and `fulfill-service`.

- [ ] **Step 5: Run focused tests and type check**

Run: `npx tsx --test src/router/workContext.test.ts src/components/views/InstitutionView.test.ts src/components/views/StudentView.test.ts && npm run lint`
Expected: PASS.

### Task 6: 验证第三轮完整客户演示

**Files:**
- Modify if required: files touched in Tasks 1–5 only.

**Interfaces:**
- Consumes: completed third-round shared state and UI.
- Produces: a verified, deploy-ready working tree without committing.

- [ ] **Step 1: Run the full automated suite**

Run: `npx tsx --test src/**/*.test.ts`
Expected: all tests pass.

- [ ] **Step 2: Run type and production checks**

Run: `npm run lint && npm run build`
Expected: both exit 0.

- [ ] **Step 3: Browser-test the complete journey**

Verify: create plan → create institution from plan → credit entry → institution-filtered organization views → student fulfillment → service-right detail.

- [ ] **Step 4: Verify exception paths**

Verify: no active plan, inactive catalog item, insufficient institution credits and duplicate student fulfillment show actionable inline feedback without losing context.

- [ ] **Step 5: Inspect browser errors and working tree**

Expected: no console errors, no dead primary actions, all edits remain uncommitted for user review.
