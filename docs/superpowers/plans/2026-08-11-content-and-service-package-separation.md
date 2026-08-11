# Content and Service Package Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将内容资源与内容包拆成清晰的两层交互，并彻底移除服务包对内容包的绑定。

**Architecture:** 保留现有 React 单页应用和左侧“内容管理”入口，通过 React Router 子路径表达“内容资源/内容包”层级。将内容包列表、详情抽屉和三步表单提取为独立组件；服务包类型和两个服务包界面只保留点数、AI 用量、有效期与状态。

**Tech Stack:** React 19、TypeScript、React Router 7、Tailwind CSS、Node test、React SSR 测试、Vite。

## Global Constraints

- 不新增运行时依赖。
- 内容包决定“能学什么”，服务包决定“可以使用多少服务”，两者不互相绑定。
- 机构详情继续分别配置内容包范围和服务包范围。
- 页面使用现有绿色后台视觉语言，不增加装饰性卡片或无数据来源指标。
- 刷新、浏览器前进和后退后恢复当前内容页面层级。

---

### Task 1: 内容管理路由状态

**Files:**
- Create: `src/router/contentRoutes.ts`
- Create: `src/router/contentRoutes.test.ts`
- Modify: `src/router/platformRoutes.ts`
- Modify: `src/components/views/QuestionBankView.tsx`

**Interfaces:**
- Produces: `ContentRouteState`, `getContentRouteState(pathname)`, `getContentRoutePath(section, resource?)`。
- Consumes: React Router 的 `useLocation()` 与 `useNavigate()`。

- [ ] **Step 1: 写失败的路由测试**

```ts
test('内容管理子路径可恢复页面层级', () => {
  assert.deepEqual(getContentRouteState('/platform/content/resources/subjects'), { section: 'resources', resource: 'subjects' });
  assert.deepEqual(getContentRouteState('/platform/content/packages'), { section: 'packages', resource: null });
  assert.equal(getContentRoutePath('resources', 'questions'), '/platform/content/resources/questions');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx tsx --test src/router/contentRoutes.test.ts`

Expected: FAIL，模块或导出尚不存在。

- [ ] **Step 3: 实现纯路由映射**

```ts
export type ContentResourceTab = 'subjects' | 'knowledge-points' | 'questions';
export type ContentRouteState =
  | { section: 'resources'; resource: ContentResourceTab }
  | { section: 'packages'; resource: null };

export const getContentRouteState = (pathname: string): ContentRouteState => {
  if (pathname.startsWith('/platform/content/packages')) return { section: 'packages', resource: null };
  const resource = pathname.split('/').at(-1);
  return {
    section: 'resources',
    resource: resource === 'knowledge-points' || resource === 'questions' ? resource : 'subjects',
  };
};
```

同时让 `/platform/content` 导航后默认替换为 `/platform/content/resources/subjects`；一级切换显示“内容资源”和“内容包”，资源层只显示“学科、知识点、题库”。

- [ ] **Step 4: 运行路由和导航测试**

Run: `npx tsx --test src/router/contentRoutes.test.ts src/navigation.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/router/contentRoutes.ts src/router/contentRoutes.test.ts src/router/platformRoutes.ts src/components/views/QuestionBankView.tsx
git commit -m "feat: separate content resource routes"
```

---

### Task 2: 服务包领域解绑

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/mockData.ts`
- Modify: `src/components/views/ServicePackageView.tsx`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/views/GoodsView.test.ts`
- Modify: `src/terminology.test.ts`

**Interfaces:**
- Produces: 不含 `contentPackageMode`、`includedContentPackages` 的 `ServicePackage`。
- Consumes: 现有 `onAddPackage`、`onUpdatePackage` 回调签名。

- [ ] **Step 1: 写失败的业务界面测试**

```ts
test('服务包只表达点数和 AI 权益，不绑定内容包', () => {
  const markup = renderGoodsView();
  assert.doesNotMatch(markup, /激活时任选|激活后包含|覆盖 \d+ 个内容包|内容包包含模式/);
  assert.match(markup, /消耗采购点数/);
  assert.match(markup, /每日 AI 上限/);
});
```

在术语扫描中增加 `contentPackageMode` 与 `includedContentPackages` 不得出现在服务包视图的断言。

- [ ] **Step 2: 运行测试确认失败**

Run: `npx tsx --test src/components/views/GoodsView.test.ts src/terminology.test.ts`

Expected: FAIL，当前卡片与表单仍渲染内容包绑定。

- [ ] **Step 3: 删除领域字段与演示数据**

从 `ServicePackage` 删除：

```ts
contentPackageMode?: 'single' | 'multiple';
includedContentPackages?: string[];
```

同步删除 mock 数据中的对应属性，保留 `subjectRequirement` 作为服务包类型本身的单科/全科规则。

- [ ] **Step 4: 收简两个服务包界面**

删除 `ALL_SYSTEM_CONTENT_PACKAGES`、表单的内容包模式与选择列表、服务包卡片的内容包摘要。标题改为“服务包配置”，说明改为“配置机构点数消耗、学生每日 AI 用量上限和服务有效期”。创建与编辑提交对象只包含 `ServicePackage` 有效字段。

- [ ] **Step 5: 运行测试和类型检查**

Run: `npx tsx --test src/components/views/GoodsView.test.ts src/terminology.test.ts && npx tsc --noEmit`

Expected: PASS，且无已删除字段的类型错误。

- [ ] **Step 6: 提交**

```bash
git add src/types/index.ts src/mockData.ts src/components/views/ServicePackageView.tsx src/components/views/GoodsView.tsx src/components/views/GoodsView.test.ts src/terminology.test.ts
git commit -m "refactor: decouple service packages from content"
```

---

### Task 3: 独立内容包管理组件

**Files:**
- Create: `src/components/content/ContentPackageManager.tsx`
- Create: `src/components/content/ContentPackageManager.test.ts`
- Modify: `src/components/views/QuestionBankView.tsx`

**Interfaces:**
- Consumes: `subjects`, `knowledgePoints`, `questions`。
- Produces: 内容包列表、详情抽屉、创建/编辑状态；回调 `onOpenResource(resource, subjectId)` 用于从详情跳回对应资源页。

- [ ] **Step 1: 写失败的静态交互测试**

```ts
test('内容包列表提供可追溯详情和明确新增流程', () => {
  const markup = renderToStaticMarkup(createElement(ContentPackageManager, fixtures));
  assert.match(markup, /内容包/);
  assert.match(markup, /查看详情/);
  assert.match(markup, /新增内容包/);
  assert.doesNotMatch(markup, />删除</);
});
```

并对导出的纯函数 `validateContentPackageDraft` 测试：无名称或内容范围为空时不可发布，有名称、学科和至少一个知识点/题目时通过。

- [ ] **Step 2: 运行测试确认失败**

Run: `npx tsx --test src/components/content/ContentPackageManager.test.ts`

Expected: FAIL，组件和校验函数尚不存在。

- [ ] **Step 3: 实现列表与安全操作**

实现搜索、学段筛选、整行/“查看详情”入口、状态切换和更多操作。已发布内容包不提供直接删除；停用后删除仍要求确认。列表只展示有来源的数据：学科、知识点数、题目数、状态。

- [ ] **Step 4: 实现右侧详情抽屉**

抽屉展示基本信息、内容范围、授权机构数与更新时间。知识点数和题目数按钮调用 `onOpenResource`；关闭抽屉后保留搜索与筛选状态。

- [ ] **Step 5: 实现三步新增/编辑流程**

步骤固定为：

```ts
type PackageWizardStep = 'basics' | 'content' | 'review';
```

第一步选择学段、学科并填写名称；第二步选择该学科已有知识点/题目范围并实时汇总；第三步确认后支持“保存草稿”或“发布”。`validateContentPackageDraft` 控制下一步和发布按钮，并显示具体缺失项。

- [ ] **Step 6: 从 QuestionBankView 移出原内容包 Tab**

`QuestionBankView` 在 `section === 'packages'` 时只渲染 `ContentPackageManager`；资源区不再包含第四个“内容包管理”标签。删除原文件内重复的内容包列表、筛选和模态框状态。

- [ ] **Step 7: 运行组件测试与类型检查**

Run: `npx tsx --test src/components/content/ContentPackageManager.test.ts src/router/contentRoutes.test.ts && npx tsc --noEmit`

Expected: PASS。

- [ ] **Step 8: 提交**

```bash
git add src/components/content/ContentPackageManager.tsx src/components/content/ContentPackageManager.test.ts src/components/views/QuestionBankView.tsx
git commit -m "feat: add standalone content package workflow"
```

---

### Task 4: 机构双权限边界回归

**Files:**
- Create: `src/components/views/InstitutionView.test.ts`
- Modify: `src/components/views/InstitutionView.tsx`
- Modify: `src/dashboardSnapshot.ts`

**Interfaces:**
- Consumes: `Institution.availableContentPackages` 与 `Institution.servicePackageIds`。
- Produces: 两组独立可保存的授权控件与清晰文案。

- [ ] **Step 1: 写失败或回归测试**

```ts
test('机构分别配置内容包和服务包范围', () => {
  const markup = renderInstitutionView();
  assert.match(markup, /可用内容包/);
  assert.match(markup, /可采购服务包/);
  assert.doesNotMatch(markup, /服务包包含内容包/);
});
```

- [ ] **Step 2: 运行测试记录当前结果**

Run: `npx tsx --test src/components/views/InstitutionView.test.ts`

Expected: 若当前文案缺失则 FAIL；若已满足则作为回归测试 PASS。

- [ ] **Step 3: 收紧机构授权文案**

统一为“内容包决定机构可使用的教学内容；服务包决定机构可采购的点数与 AI 权益”，两组选择分别计数、分别保存。驾驶舱待办改为“分别配置内容包范围和服务包范围”。

- [ ] **Step 4: 运行测试**

Run: `npx tsx --test src/components/views/InstitutionView.test.ts src/dashboardSnapshot.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/views/InstitutionView.tsx src/components/views/InstitutionView.test.ts src/dashboardSnapshot.ts
git commit -m "fix: clarify institution package permissions"
```

---

### Task 5: 全量验证与发布

**Files:**
- Modify only if verification exposes a scoped defect.

**Interfaces:**
- Consumes: Tasks 1–4 的完整交付。
- Produces: 可上线构建与 GitHub Pages 版本。

- [ ] **Step 1: 运行全部自动化验证**

Run: `npx tsc --noEmit && npx tsx --test src/*.test.ts src/router/*.test.ts src/domain/*.test.ts src/components/content/*.test.ts src/components/goods/*.test.ts src/components/views/*.test.ts src/components/institutions/*.test.ts src/utils/*.test.ts && npm run build`

Expected: 类型检查通过、测试 0 failed、Vite 构建成功。

- [ ] **Step 2: 本地浏览器验证核心路径**

检查：

1. `/platform/content/resources/subjects` 默认层级正确。
2. 切换知识点、题库、内容包后地址变化，刷新状态不丢失。
3. 内容包详情抽屉可打开/关闭，数字可追溯。
4. 三步新增流程可完成，空内容不能发布。
5. 商品与权益的服务包卡片和编辑表单不出现内容包绑定。
6. 机构详情仍分别显示两组权限。
7. 1440px 桌面和 768px 窄屏无横向遮挡。

- [ ] **Step 3: 检查变更范围并提交修复**

Run: `git diff --check && git status --short`

Expected: 无空白错误，只包含本计划文件。

- [ ] **Step 4: 推送并验证 GitHub Pages**

Run: `git push https://github.com/kessingye-gif/houtai.git HEAD:main`

等待 Actions 成功后，访问 `https://kessingye-gif.github.io/houtai/platform/content/packages`，确认 HTML 引用本次构建的资源文件并复测核心页面。

