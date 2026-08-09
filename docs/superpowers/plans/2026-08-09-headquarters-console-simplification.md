# 总部运营后台简化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将超级管理员后台改成按总部高频任务组织、文字简洁的运营控制台。

**Architecture:** 抽离统一导航模型供侧栏和测试使用，保留现有业务视图并重新映射新的任务名称。重写工作台的展示层，让高频动作、待办和风险优先，减少解释性文案与装饰。

**Tech Stack:** React 19、TypeScript、Tailwind CSS 4、tsx Node test runner

## Global Constraints

- 不增加新依赖。
- 不修改现有业务数据结构和业务表单。
- 总部监管正常开通，只在异常场景执行人工操作。
- 首页主要入口名称不超过 10 个汉字。

---

### Task 1: 任务式导航

**Files:**
- Create: `src/navigation.ts`
- Create: `src/navigation.test.ts`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `NavTab`、`navGroups` 和 `resolveLegacyView(tab)`。
- Consumes: 现有视图组件和 `setCurrentTab`。

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { navGroups, resolveLegacyView } from './navigation';

test('总部导航只展示任务式一级入口', () => {
  assert.deepEqual(navGroups.flatMap((group) => group.items.map((item) => item.label)), [
    '运营工作台', '机构运营', '内容中心', '开通监管', '异常处理', '平台设置', '操作审计',
  ]);
});

test('任务入口映射到现有业务视图', () => {
  assert.equal(resolveLegacyView('supervision'), 'goods');
  assert.equal(resolveLegacyView('exceptions'), 'system');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/navigation.test.ts`
Expected: FAIL because `src/navigation.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

创建七个任务入口及旧视图映射；侧栏只渲染统一配置；默认页改为 `dashboard`；App 根据映射渲染已有视图。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/navigation.test.ts`
Expected: 2 tests PASS.

### Task 2: 简洁运营工作台

**Files:**
- Modify: `src/components/views/DashboardView.tsx`

**Interfaces:**
- Consumes: `stats`、`institutions`、`auditLogs`、`onNavigateToTab`。
- Produces: 三个高频入口、四个紧凑指标、风险机构和最近操作列表。

- [ ] **Step 1: Add a failing source-contract test**

在 `src/navigation.test.ts` 读取工作台源码，断言包含三个入口“新增机构并分配额度”“导入知识点和题目”“处理异常”，且不包含“点击直达业务模块进行快速处理”。

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/navigation.test.ts`
Expected: FAIL because the new actions are absent.

- [ ] **Step 3: Implement the compact dashboard**

以单一白色面板、紧凑统计行、待办列表和风险机构表重写工作台；删除冗余说明和五色快捷卡片。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/navigation.test.ts`
Expected: all tests PASS.

### Task 3: 全局收尾与验证

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: 新导航名称与现有搜索状态。
- Produces: 简短搜索提示、较轻页面背景和一致布局。

- [ ] **Step 1: Simplify global copy and chrome**

搜索提示改为“搜索机构、学生、授权码”；移除浮动帮助按钮；将侧栏宽度和主内容留白统一为 220px。

- [ ] **Step 2: Run all checks**

Run: `npm run lint && npm run build && npx tsx --test src/navigation.test.ts`
Expected: type check, production build, and all tests PASS.
