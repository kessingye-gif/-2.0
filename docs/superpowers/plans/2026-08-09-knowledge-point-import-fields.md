# Knowledge Point Import Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the approved knowledge-point spreadsheet fields through one three-level outline path, preserve the internal three-level tree, and link existing questions and same-batch prerequisite knowledge points without creating questions.

**Architecture:** Add a pure import module that normalizes spreadsheet cells, validates all rows, builds a provisional three-level tree, and resolves prerequisite/question relationships in a second pass. Keep React responsible for file selection, preview, confirmation, and presentation; keep application state updates atomic through one batch callback.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Node test runner through `tsx`, SheetJS `xlsx` for local workbook parsing.

## Global Constraints

- Spreadsheet input contains one strict three-level `大纲层级路径` column separated by `—`; internal storage and UI retain level 1, level 2, and level 3.
- Level 1 and level 2 are directory nodes only; all teaching fields belong to level 3.
- `适用年级`, `关联题目`, and `最小应用验证题` use `、`; multiple prerequisite paths use `；`.
- Prerequisites are referenced by full path within the same subject and stage and may be created in the same batch regardless of row order.
- Related and minimum-validation questions must already exist in the question bank; importing knowledge points never creates or copies questions.
- Minimum-validation questions contain at least one ID and are a subset of related questions.
- Any validation error prevents the entire batch from being committed.
- Existing `grade` and `textbook` values remain readable for backward compatibility.

---

## File Structure

- Create `src/utils/knowledgePointImport.ts`: workbook-row normalization, validation, three-level tree construction, second-pass relationship resolution, and import statistics.
- Create `src/utils/knowledgePointImport.test.ts`: focused unit tests for path parsing, two-pass references, question validation, conflict/cycle detection, and atomic failures.
- Modify `src/types/index.ts`: teaching-field and import-result types.
- Modify `src/mockData.ts`: representative enriched level-3 records used by the UI.
- Modify `src/App.tsx`: atomic knowledge-point batch commit callback and audit entry.
- Modify `src/components/views/QuestionBankView.tsx`: workbook reading, preflight state, new field specification, retained three-column preview, and level-3 detail display.
- Modify `package.json` and `package-lock.json`: add SheetJS and the focused test script.

### Task 1: Extend the Knowledge Point Domain Model

**Files:**
- Modify: `src/types/index.ts:85-99`
- Modify: `src/mockData.ts:287-390`

**Interfaces:**
- Produces: `KnowledgeType`, `KnowledgePointNode`, `KnowledgePointImportError`, `KnowledgePointImportStats`, and `KnowledgePointImportResult`.
- `KnowledgePointNode.grade` and `KnowledgePointNode.textbook` remain required compatibility fields until existing callers are migrated.

- [ ] **Step 1: Add compile-time model usage that initially fails**

Create the future enriched fields on one level-3 object in `initialKnowledgePoints`:

```ts
stage: '初中',
applicableGrades: ['初一', '初二'],
applicableRegion: '全国',
knowledgeType: '概念类',
coreContent: '理解字母表示数以及代数式的基本意义。',
learningObjective: '能够识别并解释代数式中各部分的含义。',
teachingSuggestion: '先用生活数量关系引入，再过渡到符号表达。',
validationCriteria: '最小验证题正确率达到 80%。',
prerequisiteKnowledgePointIds: [],
relatedQuestionIds: ['Q-2026001'],
minimumValidationQuestionIds: ['Q-2026001'],
```

- [ ] **Step 2: Run the type checker and verify the model is incomplete**

Run: `npm run lint`

Expected: FAIL because the new properties are not declared on `KnowledgePointNode`.

- [ ] **Step 3: Add the domain and batch-result types**

Add these declarations to `src/types/index.ts`:

```ts
export type KnowledgeType =
  | '概念类'
  | '规则/公式/定理类'
  | '过程/机制/事件类';

export interface KnowledgePointNode {
  id: string;
  code: string;
  name: string;
  level: 1 | 2 | 3;
  subject: string;
  stage?: string;
  grade: string;
  applicableGrades?: string[];
  applicableRegion?: string;
  textbook: string;
  parentId?: string;
  knowledgeType?: KnowledgeType;
  coreContent?: string;
  learningObjective?: string;
  teachingSuggestion?: string;
  validationCriteria?: string;
  prerequisiteKnowledgePointIds?: string[];
  relatedQuestionIds?: string[];
  minimumValidationQuestionIds?: string[];
  questionCount: number;
  status: 'active' | 'inactive';
}

export interface KnowledgePointImportError {
  row: number;
  field: string;
  message: string;
}

export interface KnowledgePointImportStats {
  totalRows: number;
  createdDirectoryCount: number;
  createdKnowledgePointCount: number;
  updatedKnowledgePointCount: number;
  prerequisiteRelationCount: number;
  questionRelationCount: number;
}

export interface KnowledgePointImportResult {
  knowledgePoints: KnowledgePointNode[];
  stats: KnowledgePointImportStats;
  errors: KnowledgePointImportError[];
}
```

Keep the new teaching properties optional so existing level-1/2 nodes and old mock data compile unchanged.

- [ ] **Step 4: Run the type checker**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit the domain model**

```bash
git add src/types/index.ts src/mockData.ts
git commit -m "feat: extend knowledge point teaching model"
```

### Task 2: Build the Strict Path and Two-Pass Import Engine

**Files:**
- Create: `src/utils/knowledgePointImport.ts`
- Create: `src/utils/knowledgePointImport.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `KnowledgePointNode`, `QuestionItem`, `KnowledgeType`, and `KnowledgePointImportResult` from `src/types/index.ts`.
- Produces:

```ts
export interface KnowledgePointImportRow {
  knowledgePointName: string;
  subject: string;
  stage: string;
  applicableGrades: string;
  applicableRegion: string;
  outlinePath: string;
  knowledgeType: string;
  coreContent: string;
  learningObjective: string;
  teachingSuggestion: string;
  minimumValidationQuestions: string;
  relatedQuestions: string;
  validationCriteria: string;
  prerequisites?: string;
}

export function parseOutlinePath(value: string): [string, string, string];
export function importKnowledgePointRows(
  rows: KnowledgePointImportRow[],
  existingKnowledgePoints: KnowledgePointNode[],
  existingQuestions: QuestionItem[],
): KnowledgePointImportResult;
```

- [ ] **Step 1: Write failing path and happy-path tests**

Create `src/utils/knowledgePointImport.test.ts` with tests that assert:

```ts
assert.deepEqual(
  parseOutlinePath(' 数与代数 — 方程 — 一元一次方程 '),
  ['数与代数', '方程', '一元一次方程'],
);
assert.throws(() => parseOutlinePath('数与代数—方程'), /必须包含三级/);

const result = importKnowledgePointRows(
  [prerequisiteRow, targetRow],
  [],
  existingQuestions,
);
assert.deepEqual(result.errors, []);
const target = result.knowledgePoints.find((item) => item.name === '解一元一次方程');
const prerequisite = result.knowledgePoints.find((item) => item.name === '等式的性质');
assert.deepEqual(target?.prerequisiteKnowledgePointIds, [prerequisite?.id]);
assert.deepEqual(target?.minimumValidationQuestionIds, ['Q-1']);
```

Define `targetRow` before `prerequisiteRow` in the input array to prove row order does not affect prerequisite resolution.

- [ ] **Step 2: Run the focused tests and verify failure**

Add the script:

```json
"test:knowledge-import": "tsx --test src/utils/knowledgePointImport.test.ts"
```

Run: `npm run test:knowledge-import`

Expected: FAIL because `knowledgePointImport.ts` does not exist.

- [ ] **Step 3: Implement normalization and strict path parsing**

Implement:

```ts
const PATH_SEPARATOR = '—';
const LIST_SEPARATOR = '、';
const PREREQUISITE_SEPARATOR = '；';

export function parseOutlinePath(value: string): [string, string, string] {
  const segments = value.split(PATH_SEPARATOR).map((segment) => segment.trim());
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    throw new Error('大纲层级路径必须包含三级且每一级不能为空');
  }
  return segments as [string, string, string];
}

function splitList(value: string, separator = LIST_SEPARATOR): string[] {
  return [...new Set(value.split(separator).map((item) => item.trim()).filter(Boolean))];
}

function pathKey(subject: string, stage: string, path: string): string {
  return `${subject.trim()}\u0000${stage.trim()}\u0000${path.trim()}`;
}
```

Use deterministic generated IDs derived from the current maximum import sequence plus row/node order, not `Math.random()`, so one import cannot create duplicate IDs.

- [ ] **Step 4: Implement first-pass node creation and updates**

For every normalized row:

1. Validate required text fields and the controlled `KnowledgeType` value.
2. Parse the path and require `knowledgePointName === level3Name`.
3. Reuse level 1 by subject/stage/name, then level 2 by parent/name, then level 3 by parent/name.
4. Create missing directory nodes with empty compatibility `grade`, empty `textbook`, and no teaching fields.
5. Create or update the level-3 node with normalized teaching values.
6. Store `pathKey(subject, stage, outlinePath) -> level3Id` for the second pass.

Do not mutate either input array or existing node objects.

- [ ] **Step 5: Implement second-pass relationships and atomic errors**

For each row after all nodes are indexed:

1. Resolve each `；`-separated prerequisite path with the current row's subject and stage.
2. Resolve each related and minimum-validation question ID against `existingQuestions`.
3. Require at least one minimum-validation ID.
4. Require every minimum-validation ID to occur in related IDs.
5. Reject self-reference.
6. Run depth-first cycle detection over the resulting prerequisite graph.

If any error exists, return the original `existingKnowledgePoints` reference as `knowledgePoints`, zero committed counts, and the complete error list. Otherwise return the newly built array and accurate statistics.

- [ ] **Step 6: Add negative tests**

Add explicit tests for:

- knowledge-point name differs from path leaf;
- unknown question ID;
- empty minimum-validation question list;
- minimum-validation ID absent from related IDs;
- missing prerequisite path;
- duplicate same-batch path with conflicting teaching content;
- direct self-reference;
- indirect prerequisite cycle;
- an invalid second row returns the untouched existing array and commits neither row.

- [ ] **Step 7: Run importer tests and type checks**

Run: `npm run test:knowledge-import && npm run lint`

Expected: all tests PASS and TypeScript reports no errors.

- [ ] **Step 8: Commit the import engine**

```bash
git add src/utils/knowledgePointImport.ts src/utils/knowledgePointImport.test.ts package.json
git commit -m "feat: add two-pass knowledge point importer"
```

### Task 3: Parse Real Excel Workbooks and Show Atomic Preflight

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/components/views/QuestionBankView.tsx:56-66,195-205,724-830,2499-2650`
- Modify: `src/App.tsx:226-237,286-300`

**Interfaces:**
- Consumes: `KnowledgePointImportRow` and `importKnowledgePointRows(...)` from Task 2.
- Produces prop: `onBatchImportKnowledgePoints(result: KnowledgePointImportResult): void`.

- [ ] **Step 1: Install the workbook reader**

Run: `npm install xlsx`

Expected: `xlsx` is recorded in `package.json` and `package-lock.json`.

- [ ] **Step 2: Add a failing workbook-header mapping test**

Export a pure mapper from `knowledgePointImport.ts`:

```ts
export function mapWorksheetRecord(record: Record<string, unknown>): KnowledgePointImportRow;
```

Test exact Chinese headers:

```ts
const row = mapWorksheetRecord({
  知识点名称: '等式的性质',
  学科: '数学',
  学段: '初中',
  适用年级: '初一、初二',
  适用地区: '全国',
  大纲层级路径: '数与代数—方程—等式的性质',
  知识类型: '规则/公式/定理类',
  核心学习内容: '理解等式两边进行同一运算后仍相等。',
  教学目标: '能够解释并使用等式的性质。',
  教学建议: '通过天平模型说明。',
  最小应用验证题: 'Q-1',
  关联题目: 'Q-1、Q-2',
  验证通过标准: '两道验证题至少答对一道。',
  前置知识点: '',
});
assert.equal(row.outlinePath, '数与代数—方程—等式的性质');
```

- [ ] **Step 3: Implement exact header mapping**

Map all approved headers and stringify numbers safely. Ignore `知识点ID` because IDs are system-generated. Throw a file-level error listing any missing required header before row import begins.

- [ ] **Step 4: Add preflight state and file reading**

In `QuestionBankView`, add:

```ts
const [kpImportResult, setKpImportResult] = useState<KnowledgePointImportResult | null>(null);
const [kpImportFileName, setKpImportFileName] = useState('');

const handleKnowledgePointWorkbook = async (file: File) => {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
  const rows = records.map(mapWorksheetRecord);
  setKpImportResult(importKnowledgePointRows(rows, knowledgePoints, questions));
  setKpImportFileName(file.name);
};
```

Catch mapper/workbook errors and convert them into a visible file-level preflight error instead of committing state.

- [ ] **Step 5: Add the atomic batch callback**

Change `QuestionBankViewProps` to accept:

```ts
onBatchImportKnowledgePoints: (result: KnowledgePointImportResult) => void;
```

In `App.tsx`, implement:

```ts
const handleBatchImportKnowledgePoints = (result: KnowledgePointImportResult) => {
  if (result.errors.length > 0) return;
  setKnowledgePoints(result.knowledgePoints);
  addAuditLog(
    '批量导入知识点',
    `新增 ${result.stats.createdKnowledgePointCount} 个三级知识点`,
    `新增目录 ${result.stats.createdDirectoryCount} 个，更新知识点 ${result.stats.updatedKnowledgePointCount} 个。`,
    '题库管理',
  );
};
```

Wire the prop into `QuestionBankView`.

- [ ] **Step 6: Replace immediate fake upload with preflight and confirmation**

The upload flow must show:

- filename and total data rows;
- created directories, created level-3 points, updates, prerequisite relations, and question relations;
- every error as `第 N 行 · 字段 · 原因`;
- disabled “确认导入” when errors exist;
- enabled “确认导入” only when there are rows and no errors;
- confirmation calls `onBatchImportKnowledgePoints(kpImportResult)` exactly once, shows success copy, then clears preflight state.

Keep a sample-import button, but route its sample rows through the same pure importer and preflight UI.

- [ ] **Step 7: Run focused tests, type checks, and build**

Run: `npm run test:knowledge-import && npm run lint && npm run build`

Expected: all commands PASS.

- [ ] **Step 8: Commit workbook import and preflight**

```bash
git add package.json package-lock.json src/App.tsx src/components/views/QuestionBankView.tsx src/utils/knowledgePointImport.ts src/utils/knowledgePointImport.test.ts
git commit -m "feat: add knowledge point import preflight"
```

### Task 4: Replace the Import Specification and Retain Three-Level Presentation

**Files:**
- Modify: `src/components/views/QuestionBankView.tsx:897-1165,2499-2650`

**Interfaces:**
- Consumes: enriched `KnowledgePointNode` fields from Task 1 and preflight state from Task 3.
- Produces: visible three-column hierarchy and approved import instructions.

- [ ] **Step 1: Add UI-level assertions to the existing focused test**

Read the component source as text in `knowledgePointImport.test.ts` and assert the approved labels exist:

```ts
const source = readFileSync(new URL('../components/views/QuestionBankView.tsx', import.meta.url), 'utf8');
for (const label of ['大纲层级路径', '核心学习内容', '教学目标', '教学建议', '最小应用验证题', '关联题目', '验证通过标准', '前置知识点']) {
  assert.match(source, new RegExp(label));
}
for (const heading of ['一级目录', '二级目录', '三级知识点']) {
  assert.match(source, new RegExp(heading));
}
```

- [ ] **Step 2: Run the test and verify missing labels fail**

Run: `npm run test:knowledge-import`

Expected: FAIL until the old six-column specification is replaced.

- [ ] **Step 3: Replace the specification view**

Render the approved field table with columns “字段 / 属性 / 操作性定义”. Include every screenshot field and these exact rules:

- IDs are generated by the system;
- path is one strict three-level field and uses `—`;
- applicable grades and question IDs use `、`;
- prerequisites are full paths and use `；`;
- minimum questions are existing question IDs and must be a subset of related questions;
- importing knowledge points never creates questions.

- [ ] **Step 4: Retain explicit three-column hierarchy output**

In the flat knowledge-point table, render separate headers `一级目录`, `二级目录`, and `三级知识点`. Use the existing `flatKnowledgePointRows` ancestry data for each cell; do not reconstruct paths by splitting display strings.

- [ ] **Step 5: Add level-3 teaching summaries**

For level-3 rows, render compact values for stage, joined applicable grades, applicable region, and knowledge type. For legacy nodes, fall back to `grade` and `formatEducationMetadata(...)` so old data remains readable.

- [ ] **Step 6: Run tests, type checks, and build**

Run: `npm run test:knowledge-import && npm run lint && npm run build`

Expected: all commands PASS.

- [ ] **Step 7: Commit the import specification and hierarchy UI**

```bash
git add src/components/views/QuestionBankView.tsx src/utils/knowledgePointImport.test.ts
git commit -m "feat: show knowledge point import field specification"
```

### Task 5: Add Level-3 Teaching Detail and Relationship Views

**Files:**
- Modify: `src/components/views/QuestionBankView.tsx:170-240,897-1165,2180-2260`

**Interfaces:**
- Consumes: `prerequisiteKnowledgePointIds`, `relatedQuestionIds`, and `minimumValidationQuestionIds` from enriched level-3 nodes.
- Produces: selected detail state and resolved knowledge-point/question links.

- [ ] **Step 1: Add failing source assertions for detail sections**

Extend the UI source assertions to require:

```ts
for (const label of ['知识点教学详情', '前置知识点', '全部关联题目', '最小应用验证题']) {
  assert.match(source, new RegExp(label));
}
```

Run: `npm run test:knowledge-import`

Expected: FAIL because the detail panel is absent.

- [ ] **Step 2: Add selected level-3 state and resolvers**

Add:

```ts
const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<KnowledgePointNode | null>(null);

const resolveKnowledgePoint = (id: string) => knowledgePoints.find((item) => item.id === id);
const resolveQuestion = (id: string) => questions.find((item) => item.id === id);
```

Only level-3 rows expose the “查看教学详情” action.

- [ ] **Step 3: Render the teaching detail panel**

Show:

- full path derived from actual parent nodes;
- subject, stage, applicable grades, region, and knowledge type;
- core learning content, teaching objective, teaching suggestion, and validation criteria;
- prerequisite knowledge-point names and full paths;
- all related question IDs and titles;
- minimum-validation question IDs and titles with a distinct badge.

If a legacy relationship references a missing node or question, display `记录已失效（ID）` rather than hiding it or crashing.

- [ ] **Step 4: Keep manual node creation compatible**

When manually creating directory nodes, provide `stage`, `grade`, and `textbook` compatibility values. When manually creating a level-3 node without the new teaching fields, show it as “待完善” in detail rather than inventing content.

- [ ] **Step 5: Run all verification**

Run: `npm run test:knowledge-import && npm run lint && npm run build`

Expected: all commands PASS.

- [ ] **Step 6: Commit the detail experience**

```bash
git add src/components/views/QuestionBankView.tsx
git commit -m "feat: show level three teaching details"
```

### Task 6: Final Regression and Documentation Check

**Files:**
- Modify: `docs/superpowers/plans/2026-08-09-knowledge-point-import-fields.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified feature and checked execution record.

- [ ] **Step 1: Exercise the valid sample import in the app**

Start: `npm run dev`

Verify in the knowledge-point batch modal:

1. The sample reaches preflight without committing immediately.
2. Preflight reports three-level directories and relationship counts.
3. Confirmation adds/updates level-3 knowledge points.
4. The flat table retains separate level-1, level-2, and level-3 columns.
5. Teaching detail resolves prerequisites and distinguishes minimum questions.

- [ ] **Step 2: Exercise one invalid import**

Use a sheet whose minimum-validation question ID is absent from related questions. Verify the row error is shown, confirmation is disabled, and the knowledge-point count does not change.

- [ ] **Step 3: Run the complete automated verification**

Run: `npm run test:knowledge-import && npm run lint && npm run build`

Expected: all commands exit successfully.

- [ ] **Step 4: Check the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intentional tracked changes remain.

- [ ] **Step 5: Mark completed plan checkboxes and commit**

```bash
git add docs/superpowers/plans/2026-08-09-knowledge-point-import-fields.md
git commit -m "docs: complete knowledge point import plan"
```
