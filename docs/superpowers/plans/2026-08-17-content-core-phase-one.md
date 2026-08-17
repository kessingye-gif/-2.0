# 内容核心第一期 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将内容资产置于后台主链路，并让知识点详情与两类导入模板共享“章、节、知识点”和 AI 补充字段的唯一来源。

**Architecture:** 新建轻量的内容字段定义模块，集中输出知识点层级字段、AI 补充字段和“知识点为 `-`”的终点校验。导入模板和内容包详情只消费这份定义；导航保留既有路由，仅调整业务模块顺序与标签表达。

**Tech Stack:** React 19、TypeScript、Node test runner、tsx、Vite。

## Global Constraints

- “章”“节”“知识点”是三个独立字段；不得再输出“一级/二级/知识点编码及名称”合并列。
- 章和节必填；知识点可以填 `-`，且仅 `-` 表示节级终点。
- 核心学习内容、教学目标、教学建议必须同时出现在知识点详情和知识点导入列中。
- 精选题库保留题目专属字段，关联内容部分复用统一知识点字段。
- 不在本期改变服务包权益范围或登录认证行为。

---

### Task 1: 建立统一知识点字段定义

**Files:**
- Create: `src/domain/contentFields.ts`
- Create: `src/domain/contentFields.test.ts`

**Interfaces:**
- Produces: `knowledgePointBaseFields`, `knowledgePointAiFields`, `knowledgePointImportFields`, `normalizeKnowledgePointLevel`, `validateKnowledgePointLevel`。
- Consumes: 无。

- [x] **Step 1: 写入失败测试**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { knowledgePointImportFields, validateKnowledgePointLevel } from './contentFields';

test('知识点字段按章节知识点和 AI 补充信息统一排列', () => {
  assert.deepEqual(knowledgePointImportFields.map((field) => field.label), [
    '学段', '所属学科', '适用年级', '教材版本', '章', '节', '知识点',
    '前置知识点', '核心学习内容', '教学目标', '教学建议',
  ]);
});

test('知识点填 - 时表示节级终点', () => {
  assert.equal(validateKnowledgePointLevel({ chapter: '数与代数', section: '方程', knowledgePoint: '-' }), 'section_terminal');
  assert.equal(validateKnowledgePointLevel({ chapter: '数与代数', section: '方程', knowledgePoint: '' }), 'invalid');
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- src/domain/contentFields.test.ts`

Expected: FAIL，提示找不到 `./contentFields`。

- [x] **Step 3: 实现最小字段定义和校验**

```ts
export type KnowledgePointLevel = { chapter: string; section: string; knowledgePoint: string };
export type KnowledgePointLevelStatus = 'knowledge_point' | 'section_terminal' | 'invalid';

export const knowledgePointBaseFields = [
  { key: 'stage', label: '学段' }, { key: 'subject', label: '所属学科' },
  { key: 'grade', label: '适用年级' }, { key: 'textbook', label: '教材版本' },
  { key: 'chapter', label: '章' }, { key: 'section', label: '节' },
  { key: 'knowledgePoint', label: '知识点' },
] as const;
export const knowledgePointAiFields = [
  { key: 'prerequisiteKnowledgePoints', label: '前置知识点' },
  { key: 'coreContent', label: '核心学习内容' },
  { key: 'learningObjective', label: '教学目标' },
  { key: 'teachingSuggestion', label: '教学建议' },
] as const;
export const knowledgePointImportFields = [...knowledgePointBaseFields, ...knowledgePointAiFields];
export const validateKnowledgePointLevel = ({ chapter, section, knowledgePoint }: KnowledgePointLevel): KnowledgePointLevelStatus => {
  if (!chapter.trim() || !section.trim() || !knowledgePoint.trim()) return 'invalid';
  return knowledgePoint.trim() === '-' ? 'section_terminal' : 'knowledge_point';
};
```

- [x] **Step 4: 运行测试确认通过**

Run: `npm test -- src/domain/contentFields.test.ts`

Expected: PASS，两个字段与层级校验测试通过。

- [x] **Step 5: 提交**

```bash
git add src/domain/contentFields.ts src/domain/contentFields.test.ts
git commit -m "feat: define shared content fields"
```

### Task 2: 让导入模板复用统一字段

**Files:**
- Modify: `src/config/importTemplates.ts`
- Modify: `src/config/importTemplates.test.ts`

**Interfaces:**
- Consumes: `knowledgePointImportFields`、`knowledgePointBaseFields` from `src/domain/contentFields.ts`。
- Produces: 知识点模板完整使用统一字段；题库模板的前置关联字段使用统一基础字段。

- [x] **Step 1: 写入失败测试**

```ts
import { knowledgePointBaseFields, knowledgePointImportFields } from '../domain/contentFields';

test('知识点导入模板使用统一字段定义', () => {
  assert.deepEqual(importTemplates.knowledgePoints.headers, knowledgePointImportFields.map((field) => field.label));
});

test('精选题库导入模板先使用统一知识点基础字段', () => {
  assert.deepEqual(importTemplates.questions.headers.slice(0, 7), knowledgePointBaseFields.map((field) => field.label));
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- src/config/importTemplates.test.ts`

Expected: FAIL，现有合并层级列与期望的“章、节、知识点”不一致。

- [x] **Step 3: 用字段定义生成模板列头和示例行**

```ts
import { knowledgePointBaseFields, knowledgePointImportFields } from '../domain/contentFields';

const knowledgePointHeaders = knowledgePointImportFields.map((field) => field.label);
const questionHeaders = [
  ...knowledgePointBaseFields.map((field) => field.label),
  '题型', '难度', '题干', '选项', '答案', '解析', '题干图片', '选项图片',
];
```

知识点示例行填写“数与代数”“方程与不等式”“一元一次方程”；节级内容示例使用知识点 `-`。题库示例行保留上述三级关联信息以及题目专属数据。

- [x] **Step 4: 运行测试确认通过**

Run: `npm test -- src/config/importTemplates.test.ts`

Expected: PASS，两个模板测试通过。

- [x] **Step 5: 提交**

```bash
git add src/config/importTemplates.ts src/config/importTemplates.test.ts
git commit -m "feat: share content fields in import templates"
```

### Task 3: 使内容包知识点详情读取统一字段

**Files:**
- Modify: `src/components/content/ContentPackageManager.tsx`
- Modify: `src/components/content/ContentPackageManager.test.ts`

**Interfaces:**
- Consumes: `knowledgePointBaseFields`、`knowledgePointAiFields` from `src/domain/contentFields.ts`。
- Produces: 详情区显示章、节、知识点，且 AI 补充字段按唯一字段定义的标签顺序显示。

- [x] **Step 1: 写入失败测试**

```ts
test('内容包知识点详情显示统一层级与 AI 补充字段', () => {
  const markup = renderToStaticMarkup(/* ContentPackageWorkspace fixture */);
  ['章', '节', '知识点', '核心学习内容', '教学目标', '教学建议'].forEach((label) => assert.match(markup, new RegExp(label)));
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- src/components/content/ContentPackageManager.test.ts`

Expected: FAIL，详情目前仅显示合并“大纲层级路径”，没有三个独立标签。

- [x] **Step 3: 用统一字段驱动详情标签**

```tsx
import { knowledgePointAiFields, knowledgePointBaseFields } from '../../domain/contentFields';

const levelValues = { chapter: chapterName, section: sectionName, knowledgePoint: activePoint.name };
{knowledgePointBaseFields.slice(-3).map((field) => (
  <div key={field.key}><dt>{field.label}</dt><dd>{levelValues[field.key]}</dd></div>
))}
{knowledgePointAiFields.slice(1).map((field) => (
  <div key={field.key}><p>{field.label}</p><p>{aiValues[field.key] || `尚未填写${field.label}。`}</p></div>
))}
```

从当前知识点树推导章、节，详情中的最小知识点为 `-` 时显示 `-`，不再显示虚构的第三级名称。

- [x] **Step 4: 运行测试确认通过**

Run: `npm test -- src/components/content/ContentPackageManager.test.ts`

Expected: PASS，原有工作区测试和新增详情字段测试均通过。

- [x] **Step 5: 提交**

```bash
git add src/components/content/ContentPackageManager.tsx src/components/content/ContentPackageManager.test.ts
git commit -m "feat: align content package detail fields"
```

### Task 4: 调整主导航的内容优先级

**Files:**
- Modify: `src/router/platformRoutes.ts`
- Modify: `src/navigation.ts`
- Modify: `src/navigation.test.ts`

**Interfaces:**
- Consumes: 既有 `PlatformRoute` 和角色路由权限。
- Produces: 内容管理位于商品与权益之前；业务模块组名表达为“内容与业务配置”。

- [x] **Step 1: 写入失败测试**

```ts
test('内容管理是业务模块的首个核心入口', () => {
  assert.deepEqual(navGroups[1].items.slice(0, 2).map((item) => item.label), ['内容管理', '商品与权益']);
  assert.equal(navGroups[1].title, '内容与业务配置');
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- src/navigation.test.ts`

Expected: FAIL，当前首项为“商品与权益”，分组名为“业务模块”。

- [x] **Step 3: 调整路线顺序与分组标题**

```ts
export const platformRoutes: PlatformRoute[] = [
  { id: 'dashboard', /* unchanged */ },
  { id: 'content', /* unchanged */ },
  { id: 'goods', /* unchanged */ },
  // remaining routes unchanged
];

export const navGroups = [
  { items: [getPlatformRoute('dashboard')] },
  { title: '内容与业务配置', items: platformRoutes.slice(1, 7) },
  { title: '系统', items: [getPlatformRoute('system')] },
];
```

保留全部路径和角色权限，避免改变外部链接和权限范围。

- [x] **Step 4: 运行测试确认通过**

Run: `npm test -- src/navigation.test.ts`

Expected: PASS，原有角色可见性测试及新增优先级测试通过。

- [x] **Step 5: 提交**

```bash
git add src/router/platformRoutes.ts src/navigation.ts src/navigation.test.ts
git commit -m "feat: prioritize content in navigation"
```

### Task 5: 全量验证并更新交付状态

**Files:**
- Modify: `docs/superpowers/plans/2026-08-17-content-core-phase-one.md`

**Interfaces:**
- Consumes: Tasks 1–4 的实现。
- Produces: 可重复的完整验证记录。

- [x] **Step 1: 执行类型检查**

Run: `npm run lint`

Expected: PASS，TypeScript 无报错。

- [x] **Step 2: 执行全量自动化测试**

Run: `npm test`

Expected: PASS，所有测试通过。

- [x] **Step 3: 执行生产构建**

Run: `npm run build`

Expected: PASS，Vite 成功生成 `dist/`。

- [x] **Step 4: 更新计划任务状态**

将 Tasks 1–5 的全部复选框改为已完成，并在文末记录实际运行的三条验证命令及通过结果。

- [x] **Step 5: 提交**

```bash
git add docs/superpowers/plans/2026-08-17-content-core-phase-one.md
git commit -m "docs: complete content core phase one plan"
```

## 实际验证记录

- `npm test`：64 个测试通过，0 个失败。
- `npm run lint`：TypeScript 类型检查通过。
- `npm run build`：生产构建通过；保留既有单个输出文件超过 500 kB 的构建提示，本期未改变打包策略。

## 已确认的范围边界

- 知识点为 `-` 表示节级终点的字段规范已建立；本期不改变题目仅绑定第三级知识点的既有规则。
