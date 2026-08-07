# Knowledge Point Stage Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the knowledge-point table to display subject, school stage, and textbook version without exposing specific grade labels.

**Architecture:** Add a focused pure utility that maps grade labels to school stages and formats subject, stage, and version as one reusable display value. Consume it at every knowledge-point display point; existing data models and unrelated screens remain unchanged.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Node test runner through `tsx`.

## Global Constraints

- The table heading must be “关联学科 / 学段 / 版本”.
- 初一、初二、初三 display as 初中; 高一、高二、高三 display as 高中.
- The cell order is “学科 · 学段 · 教材版本”.
- Existing `grade` and `textbook` source data must remain unchanged.
- Unknown grade values must be displayed unchanged.

---

### Task 1: Standardize education metadata displays

**Files:**
- Create: `src/utils/educationStage.ts`
- Create: `src/utils/educationStage.test.ts`
- Modify: `src/components/views/QuestionBankView.tsx:1-20,1516-1545,1682,1978`

**Interfaces:**
- Produces: `getEducationStage(grade: string): string` and `formatEducationMetadata(metadata: { subject: string; grade: string; textbook: string }): string`
- Consumes: the existing knowledge-point `subject`, `grade`, and `textbook` fields.

- [x] **Step 1: Write the failing mapping test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { formatEducationMetadata, getEducationStage } from './educationStage';

test('maps junior and senior grade labels to their school stages', () => {
  assert.equal(getEducationStage('初一'), '初中');
  assert.equal(getEducationStage('初二'), '初中');
  assert.equal(getEducationStage('初三'), '初中');
  assert.equal(getEducationStage('高一'), '高中');
  assert.equal(getEducationStage('高二'), '高中');
  assert.equal(getEducationStage('高三'), '高中');
});

test('keeps an unknown grade value unchanged', () => {
  assert.equal(getEducationStage('小学六年级'), '小学六年级');
});

test('formats subject, school stage, and textbook consistently', () => {
  assert.equal(
    formatEducationMetadata({ subject: '数学', grade: '初二', textbook: '人教版' }),
    '数学 · 初中 · 人教版'
  );
});
```

- [x] **Step 2: Run the test and verify the expected failure**

Run: `npx tsx --test src/utils/educationStage.test.ts`

Expected: FAIL because `./educationStage` does not exist.

- [x] **Step 3: Add the minimal mapping utility**

```ts
const EDUCATION_STAGE_BY_GRADE: Record<string, string> = {
  初一: '初中',
  初二: '初中',
  初三: '初中',
  高一: '高中',
  高二: '高中',
  高三: '高中',
};

export function getEducationStage(grade: string): string {
  return EDUCATION_STAGE_BY_GRADE[grade] ?? grade;
}

export function formatEducationMetadata({
  subject,
  grade,
  textbook,
}: {
  subject: string;
  grade: string;
  textbook: string;
}): string {
  return `${subject} · ${getEducationStage(grade)} · ${textbook}`;
}
```

- [x] **Step 4: Run the mapping test and verify it passes**

Run: `npx tsx --test src/utils/educationStage.test.ts`

Expected: 3 tests pass and 0 fail.

- [x] **Step 5: Update the knowledge-point table presentation**

Import `getEducationStage` into `QuestionBankView.tsx`, replace the header with:

```tsx
<th className="px-5 py-3.5 font-bold">关联学科 / 学段 / 版本</th>
```

Use the common formatter in the flat table, tree card, and knowledge-point selection text. Replace the flat-table badge content with:

```tsx
{formatEducationMetadata(row)}
```

- [x] **Step 6: Verify TypeScript and the production build**

Run: `npm run lint`

Expected: exit code 0 with no TypeScript errors.

Run: `npm run build`

Expected: exit code 0 and a generated production bundle.

- [x] **Step 7: Review the diff and commit only task files**

```bash
git diff -- src/utils/educationStage.ts src/utils/educationStage.test.ts src/components/views/QuestionBankView.tsx
git add src/utils/educationStage.ts src/utils/educationStage.test.ts src/components/views/QuestionBankView.tsx docs/superpowers/plans/2026-08-07-knowledge-point-stage-display.md
git commit -m "fix: show school stage in knowledge point table"
```
