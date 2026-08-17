# 服务、内容与用户使用主线重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将平台总部后台重构为“服务产品 → 内容资产 → 用户与使用 → 支撑设置”，同时保留机构管理员、教师和旧路由兼容。

**Architecture:** 保留现有路由和页面组件，只针对超级管理员生成新的一级导航分组；教师和班级页面继续存在，但不再占据总部一级导航。平台首页使用服务包、内容包、知识点、题库与用户服务数据生成新的内容运营快照。

**Tech Stack:** React、TypeScript、React Router、node:test。

## Global Constraints

- 不删除教师、班级、学生、机构数据或旧路由。
- 教师和班级仅作为用户归属、筛选与批量操作工具。
- 点数只在服务包规则、服务开通/续费和流水中出现。
- 机构管理员和教师端现有权限与默认首页保持可用。

---

### Task 1: 重排平台总部一级导航

**Files:**
- Modify: `src/router/platformRoutes.ts`
- Modify: `src/navigation.ts`
- Test: `src/navigation.test.ts`

**Interfaces:**
- `getNavGroupsForRole('super_admin')` 输出“服务产品、内容资产、用户与使用、支撑设置”。
- `canAccessRoute` 继续允许旧教师和班级路由按原权限访问。

- [ ] **Step 1: Write the failing test**

```ts
test('平台总部导航围绕服务内容和用户使用组织', () => {
  const groups = getNavGroupsForRole('super_admin');
  assert.deepEqual(groups.map((group) => group.title ?? null), [null, '核心运营', '支撑设置']);
  assert.deepEqual(groups.flatMap((group) => group.items).map((item) => item.label), ['运营首页', '服务产品', '内容资产', '用户与使用', '机构管理', '系统管理']);
  assert.equal(groups.flatMap((group) => group.items).some((item) => ['教师管理', '班级管理'].includes(item.label)), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/navigation.test.ts`

Expected: FAIL because the current总部导航 exposes teacher, class and student management as peers.

- [ ] **Step 3: Implement minimal role-specific navigation**

Rename dashboard/goods/content/students labels to “运营首页/服务产品/内容资产/用户与使用”. Build super-admin groups explicitly from `dashboard`, `goods`, `content`, `students`, `institutions`, and `system`; retain the current route permissions for institution administrators and teachers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/navigation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/router/platformRoutes.ts src/navigation.ts src/navigation.test.ts
git commit -m "feat: center navigation on service content and users"
```

### Task 2: 将平台首页改为内容与服务运营首页

**Files:**
- Modify: `src/dashboardSnapshot.ts`
- Modify: `src/dashboardSnapshot.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- `derivePlatformDashboardSnapshot` 新增 `servicePackages`, `contentPackages`, `knowledgePoints`, `questions` 输入。
- 平台首页 section IDs 为 `serviceProducts`, `contentAssets`, `userUsage`；机构和教师快照仍可使用原 section IDs。

- [ ] **Step 1: Write the failing test**

```ts
test('平台首页优先展示服务产品、内容资产和用户使用', () => {
  assert.deepEqual(snapshot.sections.map((section) => section.title), ['服务产品', '内容资产', '用户与使用']);
  const ids = snapshot.sections.flatMap((section) => section.metrics.map((metric) => metric.id));
  assert.ok(ids.includes('activeServicePackages'));
  assert.ok(ids.includes('contentPackages'));
  assert.ok(ids.includes('knowledgePoints'));
  assert.equal(ids.includes('remainingQuota'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/dashboardSnapshot.test.ts`

Expected: FAIL because the current first section is institution and quota operations.

- [ ] **Step 3: Implement the new platform snapshot**

Derive active service packages, content package count, knowledge point count, enabled question count, service users, pending activation, AI usage allocation and incomplete service/content configuration. Link metrics to `/platform/goods`, `/platform/content`, and `/platform/students`. Keep institution and teacher dashboard functions unchanged.

- [ ] **Step 4: Pass shared data from App**

Update the `derivePlatformDashboardSnapshot` call in `App.tsx` to pass `packages`, `initialContentPackages`, `knowledgePoints`, and `questions`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/dashboardSnapshot.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/dashboardSnapshot.ts src/dashboardSnapshot.test.ts src/App.tsx
git commit -m "feat: make dashboard content and service focused"
```

### Task 3: 将学生入口升级为用户与使用

**Files:**
- Modify: `src/components/views/StudentView.tsx`
- Modify: `src/components/views/StudentView.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- `/platform/students` 保持旧路径，但页面对总部角色显示“用户与使用”语义。
- 教师和班级继续作为筛选项，不拥有独立服务或点数主流程。

- [ ] **Step 1: Write the failing test**

```ts
test('总部用户页面以服务和使用为主，教师班级只作为归属条件', () => {
  assert.match(source, /用户与使用/);
  assert.match(source, /服务包/);
  assert.match(source, /教师归属|负责教师/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/views/StudentView.test.ts`

Expected: FAIL because the page currently presents itself as student management.

- [ ] **Step 3: Implement the page hierarchy**

For super administrators, lead with user service status, current service package, selected content, expiry and usage. Keep institution, teacher, grade and class as filters or secondary metadata. Keep teacher-facing copy and permissions unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/views/StudentView.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/StudentView.tsx src/components/views/StudentView.test.ts src/App.tsx
git commit -m "feat: focus user page on service usage"
```

### Task 4: 验证旧路由、权限与整体构建

**Files:**
- Modify: `src/navigation.test.ts`
- Modify: `src/dashboardSnapshot.test.ts`

- [ ] **Step 1: Add compatibility assertions**

```ts
test('旧教师和班级路由继续可访问但不占据总部一级导航', () => {
  assert.equal(canAccessRoute('super_admin', 'teachers'), true);
  assert.equal(canAccessRoute('super_admin', 'classes'), true);
  assert.equal(getNavGroupsForRole('super_admin').flatMap((group) => group.items).some((item) => item.id === 'teachers' || item.id === 'classes'), false);
});
```

- [ ] **Step 2: Run full verification**

Run: `npm test && npm run lint`

Expected: all tests pass and TypeScript exits with code 0.

- [ ] **Step 3: Commit regression tests**

```bash
git add src/navigation.test.ts src/dashboardSnapshot.test.ts
git commit -m "test: protect service content user information architecture"
```
