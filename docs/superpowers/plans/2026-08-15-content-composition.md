# 内容包组合关系 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让总部内容包显式选择知识点和题目，题目路径实时派生，统计与机构授权使用唯一 ID。

**Architecture:** 新建纯领域模块计算内容包的可交付知识点、题目与统计；React 页面只消费该结果。内容包组合写入唯一的 `ContentPackageItem`，机构授权从名称数组迁移为 ID 数组，并在读取旧数据时保持兼容。

**Tech Stack:** React 19、TypeScript、Node test runner (`tsx --test`)、Tailwind CSS。

## Global Constraints

- 内容包仅由超级管理员创建、编辑和发布；机构和教师只能读取授权范围。
- 内容包至少包含一个三级知识点或题目才能发布；草稿可不完整。
- 题目只以 `knowledgePointLevel3Id` 为知识归属；展示路径由知识点树派生。
- 停用题目和停用知识点不计入可交付统计。
- 本轮不实现审核流、内容版本、导入任务队列和导入回滚。

---

### Task 1: 建立内容包组合领域模型与统计

**Files:**
- Create: `src/domain/contentComposition.ts`
- Test: `src/domain/contentComposition.test.ts`
- Modify: `src/types/index.ts:130-142`

**Interfaces:**
- Consumes: `ContentPackageItem`、`KnowledgePointNode`、`QuestionItem`。
- Produces: `resolveContentPackageComposition(pkg, knowledgePoints, questions)`，返回 `{ knowledgePoints, questions, knowledgePointCount, questionCount }`。
- `ContentPackageItem` 增加 `knowledgePointIds: string[]` 和可选 `questionIds?: string[]`。

- [ ] **Step 1: Write failing composition tests**

```ts
test('内容包只交付已选三级知识点下的启用题目', () => {
  const result = resolveContentPackageComposition(
    { ...pkg, knowledgePointIds: ['KP-1'], questionIds: [] },
    [level3Point('KP-1'), level3Point('KP-2')],
    [question('Q-1', 'KP-1'), question('Q-2', 'KP-2')],
  );
  assert.deepEqual(result.questions.map((item) => item.id), ['Q-1']);
});

test('题目白名单只能交付已选知识点下的启用题目', () => {
  const result = resolveContentPackageComposition(
    { ...pkg, knowledgePointIds: ['KP-1'], questionIds: ['Q-1', 'Q-2'] },
    [level3Point('KP-1'), level3Point('KP-2')],
    [question('Q-1', 'KP-1'), question('Q-2', 'KP-2')],
  );
  assert.deepEqual(result.questions.map((item) => item.id), ['Q-1']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/contentComposition.test.ts`

Expected: FAIL because the composition module does not exist.

- [ ] **Step 3: Add types and minimal resolver**

```ts
export function resolveContentPackageComposition(
  pkg: ContentPackageItem,
  knowledgePoints: KnowledgePointNode[],
  questions: QuestionItem[],
) {
  const selectedPoints = knowledgePoints.filter((point) => point.level === 3 && pkg.knowledgePointIds.includes(point.id));
  const allowedPointIds = new Set(selectedPoints.filter((point) => point.status === 'active').map((point) => point.id));
  const eligibleQuestions = questions.filter((question) => question.status === 'active' && allowedPointIds.has(question.knowledgePointLevel3Id));
  const selectedQuestions = pkg.questionIds?.length
    ? eligibleQuestions.filter((question) => pkg.questionIds!.includes(question.id))
    : eligibleQuestions;
  return { knowledgePoints: selectedPoints, questions: selectedQuestions, knowledgePointCount: selectedPoints.length, questionCount: selectedQuestions.length };
}
```

- [ ] **Step 4: Add disabled-content tests**

```ts
test('停用题目和停用知识点不计入内容包统计', () => {
  // 一个 active point、一个 inactive point；各自一题，其中一题 inactive
  // 断言 knowledgePointCount 与 questionCount 仅包含可交付内容
});
```

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- src/domain/contentComposition.test.ts`

Expected: all content-composition tests PASS.

```bash
git add src/types/index.ts src/domain/contentComposition.ts src/domain/contentComposition.test.ts
git commit -m "feat: model content package composition"
```

### Task 2: 统一内容包状态与编辑入口

**Files:**
- Modify: `src/App.tsx:76-104, 466-495`
- Modify: `src/components/views/QuestionBankView.tsx:1-170, 500-540, 900-1100, 2724-2800`
- Modify: `src/components/content/ContentPackageManager.tsx:1-260`
- Test: `src/components/content/ContentPackageManager.test.ts`

**Interfaces:**
- Consumes: `contentPackages: ContentPackageItem[]` and callbacks `onAddContentPackage`, `onUpdateContentPackage` owned by `App`.
- Produces: 超级管理员可配置 `knowledgePointIds` 和 `questionIds` 的内容包；机构/教师只读取平台内容包。

- [ ] **Step 1: Write failing UI behavior test**

```ts
test('内容包列表展示由组合关系计算的题量，而不是存储题量', () => {
  const result = resolveContentPackageComposition(packageWithOnePoint, points, questions);
  const markup = renderContentPackageManager({ packages: [packageWithOnePoint], knowledgePoints: points, questions });
  assert.match(markup, new RegExp(`关联题目.*${result.questionCount}`));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/content/ContentPackageManager.test.ts`

Expected: FAIL because the manager does not accept platform packages or question data.

- [ ] **Step 3: Replace local package copies with App-owned state**

In `App.tsx`, add `const [contentPackages, setContentPackages] = useState(initialContentPackages);` and pass it to both `QuestionBankView` and `InstitutionView`.

In `QuestionBankView` and `ContentPackageManager`, remove `initialContentPackages`, `seedPackages`, and component-owned package state. Add props:

```ts
packages: ContentPackageItem[];
questions: QuestionItem[];
onAddPackage: (pkg: Omit<ContentPackageItem, 'id'>) => void;
onUpdatePackage: (id: string, changes: Partial<ContentPackageItem>) => void;
```

Use `resolveContentPackageComposition` to render counts and resources.

- [ ] **Step 4: Add explicit content selection to package editor**

The editor first lists level-3 knowledge points filtered by selected subject, with checkboxes bound to `knowledgePointIds`. It then lists only questions whose `knowledgePointLevel3Id` is selected, with a mode switch:

```ts
type QuestionScope = 'allSelectedKnowledgePoints' | 'selectedQuestions';
```

When `allSelectedKnowledgePoints` is selected, save `questionIds: []`; when `selectedQuestions` is selected, save checked question IDs. Disable publish unless there is at least one selected knowledge point or question.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- src/components/content/ContentPackageManager.test.ts`

Expected: component tests PASS and no duplicate local package source remains.

```bash
git add src/App.tsx src/components/views/QuestionBankView.tsx src/components/content/ContentPackageManager.tsx src/components/content/ContentPackageManager.test.ts
git commit -m "feat: configure explicit content package scope"
```

### Task 3: 题目路径派生与实时题量

**Files:**
- Create: `src/domain/knowledgePointPath.ts`
- Test: `src/domain/knowledgePointPath.test.ts`
- Modify: `src/App.tsx:378-391`
- Modify: `src/components/views/QuestionBankView.tsx:700-760, 1190-1310, 1460-1800`

**Interfaces:**
- Produces: `resolveKnowledgePointPath(leafId, nodes): { level1Id, level2Id, level3Id, pathName } | null`.
- Question forms submit only `knowledgePointLevel3Id`; App derives compatibility fields when saving until legacy fields can be removed.

- [ ] **Step 1: Write failing path test**

```ts
test('题目路径由三级知识点及其父节点实时派生', () => {
  const path = resolveKnowledgePointPath('KP-3', [chapter('KP-1'), section('KP-2', 'KP-1'), point('KP-3', 'KP-2')]);
  assert.deepEqual(path, { level1Id: 'KP-1', level2Id: 'KP-2', level3Id: 'KP-3', pathName: '数学 > 方程 > 解方程' });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/knowledgePointPath.test.ts`

Expected: FAIL because the path resolver does not exist.

- [ ] **Step 3: Implement path resolver and use it at all question render points**

The resolver walks `parentId` from the selected level-3 node, returns `null` if it cannot form exactly three levels, and builds the path from node names. In question editing and list/detail rendering, call the resolver rather than trusting stored `knowledgePointLevel1Id`, `knowledgePointLevel2Id`, or `knowledgePointPathName`.

- [ ] **Step 4: Derive counts instead of mutating counters**

Use `questions.filter((question) => question.status === 'active' && question.knowledgePointLevel3Id === node.id).length` for each leaf question count. Use Task 1 resolver for package counts. Do not increment or decrement `KnowledgePointNode.questionCount` in question handlers.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- src/domain/knowledgePointPath.test.ts && npm test -- src/components/content/ContentPackageManager.test.ts`

Expected: path and composition tests PASS; moving a question's leaf ID changes its displayed path and counts.

```bash
git add src/domain/knowledgePointPath.ts src/domain/knowledgePointPath.test.ts src/App.tsx src/components/views/QuestionBankView.tsx
git commit -m "refactor: derive question paths and content counts"
```

### Task 4: 机构授权改为内容包 ID

**Files:**
- Modify: `src/types/index.ts:31-32`
- Create: `src/domain/contentPackageAuthorization.ts`
- Test: `src/domain/contentPackageAuthorization.test.ts`
- Modify: `src/mockData.ts:40-186`
- Modify: `src/App.tsx:474-495`
- Modify: `src/components/views/InstitutionView.tsx:75-80, 263-278, 826-833, 1008-1010`
- Modify: `src/components/views/QuestionBankView.tsx:510-517`

**Interfaces:**
- Produces: `normalizeContentPackageIds(values: string[], packages: ContentPackageItem[]): { ids: string[]; unresolved: string[] }`.
- Institution stores `availableContentPackageIds?: string[]`; old `availableContentPackages` is read only for migration compatibility.

- [ ] **Step 1: Write failing authorization normalization test**

```ts
test('旧内容包名称迁移为唯一内容包 ID', () => {
  assert.deepEqual(
    normalizeContentPackageIds(['初中数学内容包', 'CP-02', '不存在'], packages),
    { ids: ['CP-01', 'CP-02'], unresolved: ['不存在'] },
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/contentPackageAuthorization.test.ts`

Expected: FAIL because the authorization normalizer does not exist.

- [ ] **Step 3: Implement compatibility normalization and switch all writes to IDs**

`InstitutionView` reads normalized IDs for existing institutions, but `saveAuthorizationScope` writes only `availableContentPackageIds`. `QuestionBankView` filters authorized packages with `pkg.id` rather than package names. Update mock data to store IDs for every institution.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm test -- src/domain/contentPackageAuthorization.test.ts`

Expected: normalization test PASS; unmatched legacy values are reported and not silently authorized.

```bash
git add src/types/index.ts src/domain/contentPackageAuthorization.ts src/domain/contentPackageAuthorization.test.ts src/mockData.ts src/App.tsx src/components/views/InstitutionView.tsx src/components/views/QuestionBankView.tsx
git commit -m "refactor: authorize institutions by content package id"
```

### Task 5: Full verification

**Files:**
- Verify only.

- [ ] **Step 1: Run full suite, typecheck, and build**

Run: `npm test && npm run lint && npm run build`

Expected: every test passes, TypeScript reports no errors, and Vite completes production build.

- [ ] **Step 2: Manual browser validation**

As super administrator, create two same-subject content packages with different selected knowledge points. Confirm their delivered question counts differ. Authorize one package to an institution and change to institution/teacher identity; confirm only that package is visible. Move one question to a new knowledge point and confirm its displayed path and both package counts update.

- [ ] **Step 3: Confirm clean status**

Run: `git status --short`

Expected: no uncommitted product changes remain.
