# 前置知识点与题目媒体导入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让前置知识点、知识点批量导入模板、题目图片导入和内容包依赖在后台一致可用。

**Architecture:** 扩展共享模型；将路径、前置关系和图片预检放在纯函数中；页面只负责编辑、展示预检与在成功后提交。内容包在选择知识点时递归计算缺失依赖。

**Tech Stack:** React 19、TypeScript、Tailwind CSS、Node test、Vite。

## Global Constraints

- 前置关系仅保存三级知识点稳定 ID；不能自引用或形成环。
- 导入路径严格三级，用 `—` 分隔；多个前置路径用 `；` 分隔。
- 题目只导入题干图片、选项图片；解析不导入图片。
- 任意预检错误时禁止提交，不能产生部分数据。
- 不覆盖当前未提交的内容包相关改动。

---

### Task 1: 建立知识点元数据、前置关系和导入预检

**Files:**

- Modify: `src/types/index.ts`
- Create: `src/utils/knowledgePointImport.ts`
- Create: `src/utils/knowledgePointImport.test.ts`
- Modify: `src/utils/dataSplitter.ts`

**Interfaces:**

- Produces: `KnowledgePointMetadata`（学段、年级、地区、内容/目标/建议、验证题、关联题、前置 ID）及 `preflightKnowledgePointImport(rows, nodes, questions)`。
- Produces: `validatePrerequisites(nodes, targetId, ids): string[]`。

- [ ] **Step 1: Write failing tests**

```ts
test('拒绝自身和环路前置关系', () => {
  assert.deepEqual(validatePrerequisites(nodes, 'KP-1', ['KP-1']), ['前置知识点不能包含当前知识点']);
  assert.deepEqual(validatePrerequisites(nodes, 'KP-1', ['KP-3']), ['前置知识点不能形成循环依赖']);
});
test('预检解析同批次后续行的前置路径', () => {
  assert.equal(preflightKnowledgePointImport(rows, [], questions).errors.length, 0);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/utils/knowledgePointImport.test.ts`

Expected: FAIL because the module and functions do not exist.

- [ ] **Step 3: Implement minimally**

Add metadata to `KnowledgePointNode`. Parse template rows in two passes: create/update directories and level-3 nodes by `subject + stage + path`, then resolve question IDs and prerequisite paths to IDs. Return additions, updates, errors and counts without mutating arguments. Reject missing headers, invalid fields, bad paths, unmatched questions/prerequisites, invalid minimum-question subsets, duplicate conflicts, self references and cycles.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/utils/knowledgePointImport.test.ts src/utils/dataSplitter.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/types/index.ts src/utils/dataSplitter.ts src/utils/knowledgePointImport.ts src/utils/knowledgePointImport.test.ts && git commit -m "feat: validate prerequisite knowledge imports"`

### Task 2: 建立题干与选项图片预检

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/utils/dataSplitter.ts`
- Create: `src/utils/questionMediaImport.ts`
- Create: `src/utils/questionMediaImport.test.ts`

**Interfaces:**

- Produces: `QuestionMedia { stemImagePath?: string; optionImagePaths?: string[] }`。
- Produces: `preflightQuestionMedia(rows, archivePaths)`。

- [ ] **Step 1: Write failing tests**

```ts
test('题干与选项图片可关联压缩包中的文件', () => {
  assert.deepEqual(preflightQuestionMedia([{ stemImagePath: 'stem/q1.png', optionImagePaths: ['option/a.png'] }], ['stem/q1.png', 'option/a.png']).errors, []);
});
test('缺失和重复图片会被拒绝', () => {
  assert.equal(preflightQuestionMedia([{ stemImagePath: 'missing.gif' }], ['same.png', 'same.png']).errors.length, 2);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/utils/questionMediaImport.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement minimally**

Add optional media metadata to `QuestionItem` and `SingleTableRowInput`. Read `题干图片` and `选项图片` as archive-relative paths, splitting option values by `、`; accept only jpg/jpeg/png/webp and reject duplicated archive paths, unavailable files and directories. Preserve only validated media in generated questions.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/utils/questionMediaImport.test.ts src/utils/dataSplitter.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/types/index.ts src/utils/dataSplitter.ts src/utils/questionMediaImport.ts src/utils/questionMediaImport.test.ts && git commit -m "feat: validate question import media"`

### Task 3: 接入知识点和题库管理交互

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/components/views/QuestionBankView.tsx`
- Modify: `src/components/views/QuestionBankView.test.tsx`
- Modify: `src/mockData.ts`

**Interfaces:**

- Consumes: Task 1、2 的预检函数。
- Produces: 仅在预检无错时更新的知识点/题目回调负载。

- [ ] **Step 1: Write failing UI tests**

```tsx
it('在大纲层级路径之后展示可定位的前置知识点', () => {
  render(<QuestionBankView {...props} />);
  expect(screen.getByText('前置知识点')).toBeInTheDocument();
});
it('预检有错误时禁用确认导入', () => {
  render(<QuestionBankView {...props} />);
  expect(screen.getByRole('button', { name: '确认导入' })).toBeDisabled();
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/views/QuestionBankView.test.tsx`

Expected: FAIL because the required detail and preflight controls are absent.

- [ ] **Step 3: Implement minimally**

Add standard-template download and field guide to the knowledge-point import modal. Add all confirmed editable fields and a searchable multi-select; show the prerequisite field immediately after “大纲层级路径”, use a clickable name/path chip to select its target. Change import preview to display line errors and enable confirm only on zero errors.

Change question import into one task containing an Excel input and optional image ZIP input. Show only the two approved image columns and preview media errors. Render stem/option images next to their matching text. Update App handlers and samples to retain all metadata.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/views/QuestionBankView.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/App.tsx src/components/views/QuestionBankView.tsx src/components/views/QuestionBankView.test.tsx src/mockData.ts && git commit -m "feat: manage prerequisite knowledge and question media"`

### Task 4: 内容包显示缺失依赖并一键补齐

**Files:**

- Create: `src/utils/contentPackageDependencies.ts`
- Create: `src/utils/contentPackageDependencies.test.ts`
- Modify: `src/components/content/ContentPackageManager.tsx`
- Modify: `src/components/content/ContentPackageManager.test.ts`

**Interfaces:**

- Produces: `getMissingPrerequisites(selectedIds, nodes)` 和 `addMissingPrerequisites(selectedIds, nodes)`。

- [ ] **Step 1: Write failing tests**

```ts
test('递归列出内容包缺失的前置知识点', () => {
  assert.deepEqual(getMissingPrerequisites(['KP-app'], nodes).map((item) => item.id), ['KP-equation', 'KP-property']);
});
test('一键补齐保留已选项并去重', () => {
  assert.deepEqual(addMissingPrerequisites(['KP-app', 'KP-property'], nodes), ['KP-app', 'KP-property', 'KP-equation']);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/utils/contentPackageDependencies.test.ts`

Expected: FAIL because the dependency utility does not exist.

- [ ] **Step 3: Implement minimally**

Traverse `prerequisiteKnowledgePointIds` breadth-first in stable source order. In the package review step, list missing name/path values, present “一键补齐前置依赖”, and preserve the publish action with the warning if the operator declines. Keep existing user changes in this component intact.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/utils/contentPackageDependencies.test.ts src/components/content/ContentPackageManager.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/components/content/ContentPackageManager.tsx src/components/content/ContentPackageManager.test.ts src/utils/contentPackageDependencies.ts src/utils/contentPackageDependencies.test.ts && git commit -m "feat: warn on missing content package prerequisites"`

### Task 5: Full verification

**Files:** none

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run type verification**

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: exit code 0 and generated `dist/`.
