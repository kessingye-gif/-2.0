# 内容包卡片布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将内容包表格列表改为响应式卡片网格，同时保留筛选、新建、详情和资源跳转功能。

**Architecture:** 仅调整 `ContentPackageManager` 的列表呈现层，继续使用现有组件状态、筛选结果与事件回调。测试通过服务端渲染断言卡片结构和关键文案，随后执行完整类型检查与生产构建。

**Tech Stack:** React 19、TypeScript、Tailwind CSS 4、Node test runner、Vite

## Global Constraints

- 延续现有后台的绿色主色、白色卡片、浅灰边框和圆角体系。
- 大屏三列、中屏两列、小屏一列。
- 不修改内容包数据结构、新建向导、详情抽屉或资源跳转逻辑。
- 搜索或筛选无结果时显示明确的空状态。
- 长名称允许自然换行，指标数字使用千分位格式。

---

### Task 1: 内容包响应式卡片列表

**Files:**
- Modify: `src/components/content/ContentPackageManager.test.ts`
- Modify: `src/components/content/ContentPackageManager.tsx`

**Interfaces:**
- Consumes: `filtered: ContentPackageRecord[]`、`subjectById(id)`、`setSelected(pkg)`、`onOpenResource(resource, subjectId)`
- Produces: 响应式卡片网格、空结果提示和机构边界说明；不新增对外接口

- [ ] **Step 1: 写入失败的结构测试**

在现有首个测试中加入以下断言：

```ts
assert.match(markup, /进入内容包/);
assert.match(markup, /机构边界/);
assert.match(markup, /data-content-package-grid="true"/);
assert.doesNotMatch(markup, /<table/);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --import tsx --test src/components/content/ContentPackageManager.test.ts`

Expected: FAIL，缺少“进入内容包”“机构边界”或卡片网格标识，并仍包含 `<table>`。

- [ ] **Step 3: 实现最小卡片网格**

用以下结构替换当前表格容器；保留现有数据与回调：

```tsx
<div data-content-package-grid="true" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
  {filtered.map((pkg) => {
    const subject = subjectById(pkg.subjectId);
    return <article key={pkg.id}>{/* 状态、名称、来源、三项指标与进入按钮 */}</article>;
  })}
</div>
```

状态样式分别覆盖 `active`、`draft` 和 `inactive`。知识点与题目数字按钮继续调用 `onOpenResource`，数字显示使用 `toLocaleString('zh-CN')`；“进入内容包”调用 `setSelected(pkg)`。

当 `filtered.length === 0` 时渲染：

```tsx
<div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-14 text-center">
  <p className="font-bold text-[#334155]">没有找到匹配的内容包</p>
  <p className="mt-1 text-[12px] text-[#94A3B8]">请尝试调整关键词或学段筛选。</p>
</div>
```

在网格下添加浅绿色“机构边界”说明条。

- [ ] **Step 4: 运行组件测试并确认通过**

Run: `node --import tsx --test src/components/content/ContentPackageManager.test.ts`

Expected: 2 tests PASS。

- [ ] **Step 5: 提交卡片列表**

```bash
git add src/components/content/ContentPackageManager.tsx src/components/content/ContentPackageManager.test.ts
git commit -m "feat: show content packages as cards"
```

### Task 2: 完整验证与视觉检查

**Files:**
- Verify: `src/components/content/ContentPackageManager.tsx`
- Verify: `src/components/content/ContentPackageManager.test.ts`

**Interfaces:**
- Consumes: Task 1 的卡片网格页面
- Produces: 通过类型、测试、构建和响应式视觉检查的实现

- [ ] **Step 1: 运行类型检查**

Run: `npm run lint`

Expected: TypeScript exits 0。

- [ ] **Step 2: 运行完整测试**

Run: `node --import tsx --test src/**/*.test.ts src/**/*.test.tsx`

Expected: 全部测试 PASS。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: Vite build exits 0 并生成 `dist`。

- [ ] **Step 4: 检查桌面与窄屏布局**

启动现有 Vite 页面，在约 1440px 宽度确认三列，在约 768px 确认两列，在约 390px 确认单列；同时检查状态标签、长标题、数字按钮、详情抽屉和空状态没有溢出。

- [ ] **Step 5: 若视觉检查产生修正则提交**

```bash
git add src/components/content/ContentPackageManager.tsx src/components/content/ContentPackageManager.test.ts
git commit -m "fix: polish responsive content package cards"
```
