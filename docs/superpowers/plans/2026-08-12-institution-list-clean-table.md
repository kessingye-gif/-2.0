# Institution List Clean Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将机构列表收紧为信息层级清晰、操作轻量、一眼可扫读的运营表格。

**Architecture:** 仅调整 `InstitutionView` 的列表展示层，不改变机构数据、筛选、授权弹窗、额度入账和详情抽屉的现有数据流。通过 SSR 组件测试锁定可见文案和装饰元素的删减，再用实际浏览器验证密度和入口。

**Tech Stack:** React 19, TypeScript, Tailwind CSS utility classes, Node test runner, React server rendering.

## Global Constraints

- 保留五列桌面端表格，不改为卡片。
- 正常状态使用绿点，已停用使用灰色标签，不使用删除线。
- 列表不显示电话、额度百分比文字、授权重复说明或机构圆形图标。
- 操作保留“授权”、“入账”和更多三个入口。
- 不提交任何代码或文档。

---

### Task 1: Lock the clean row information hierarchy

**Files:**
- Modify: `src/components/views/InstitutionView.test.ts`
- Test: `src/components/views/InstitutionView.test.ts`

**Interfaces:**
- Consumes: `InstitutionView` 及 `initialInstitutions` 的正常、低额度和停用数据。
- Produces: 对“剩余点数、授权摘要、轻量操作”及被删除信息的 SSR 回归测试。

- [ ] **Step 1: Write the failing rendering assertions**

```ts
assert.match(markup, /剩余 75,402 点/);
assert.match(markup, /4 内容包 · 4 服务包/);
assert.match(markup, />授权</);
assert.match(markup, />入账</);
assert.doesNotMatch(markup, /138-8888-0001/);
assert.doesNotMatch(markup, /内容与服务包范围独立配置/);
assert.doesNotMatch(markup, /line-through/);
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx tsx --test src/components/views/InstitutionView.test.ts`

Expected: FAIL because the current row still renders the phone, verbose quota, long action labels, repeated scope explanation, icon container, and strike-through state.

### Task 2: Implement the clean institution row

**Files:**
- Modify: `src/components/views/InstitutionView.tsx`
- Test: `src/components/views/InstitutionView.test.ts`

**Interfaces:**
- Consumes: existing `openAuthorizationModal(inst)`, `onCreditEntry(inst.id)`, detail drawer state, `remainingPct`, `isWarning`, and `getScopeSummary(inst)`.
- Produces: the same five-column table and the same click behavior with a reduced visual surface.

- [ ] **Step 1: Replace the institution identity cell**

Render the institution name with an inline green status dot for active rows, a muted status badge for inactive rows, and one secondary line for code plus region. Remove the circular school icon and all `line-through` classes.

- [ ] **Step 2: Simplify contact and quota cells**

Render only `inst.contactPerson` in the contact cell. Render `剩余 {inst.remainingQuota.toLocaleString()} 点` and one short progress bar in the quota cell; retain red warning and gray inactive states without percentage text.

- [ ] **Step 3: Simplify authorization and actions**

Render `{contentCount} 内容包 · {serviceCount} 服务包` as plain text. Replace action labels with `授权`, `入账`, and the existing more icon, using text/ghost controls without filled button backgrounds.

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test src/components/views/InstitutionView.test.ts`

Expected: all tests PASS.

### Task 3: Verify layout and behavior in the real page

**Files:**
- Modify only if visual verification identifies a defect: `src/components/views/InstitutionView.tsx`

**Interfaces:**
- Consumes: `http://127.0.0.1:3000/platform/institutions`.
- Produces: verified desktop layout with working authorization, credit-entry, and detail interactions.

- [ ] **Step 1: Run static checks and production build**

Run: `npm run lint`

Expected: TypeScript exits with code 0.

Run: `npm run build`

Expected: Vite build exits with code 0.

- [ ] **Step 2: Inspect all three row states in the browser**

Verify one active row, one low-quota row, and the inactive row. Confirm compact row height, readable columns, no overlapping actions, no phone, no percentage label, no decorative institution/scope icon, and no strike-through.

- [ ] **Step 3: Verify actions**

Click `授权` and confirm the institution authorization dialog opens. Close it, click `入账` and confirm the selected institution is prefilled. Return and click more to confirm the institution detail drawer opens.

- [ ] **Step 4: Run the complete test suite**

Run: `npx tsx --test src/**/*.test.ts`

Expected: all tests PASS with zero failures.
