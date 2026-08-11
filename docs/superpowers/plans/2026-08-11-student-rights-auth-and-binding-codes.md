# Student Rights, Auth and Binding Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move student rights into Student Management, add direct student authorization-code and guardian binding-code generation, and split knowledge-point metadata into independent table columns.

**Architecture:** `App` remains the source of truth for student authorization codes and passes them to both supervision and student management. `StudentView` derives rights from those codes and locally owns guardian binding-code demo records. Navigation gains a student route, while `QuestionBankView` changes presentation only and reuses the existing education-stage normalizer.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Node test runner via `tsx --test`.

## Global Constraints

- Do not add backend integration or new dependencies.
- Do not change `KnowledgePointNode`, batch-import formats, or question foreign keys.
- Do not use “测试码” wording in the student authorization-code generation flow.
- Keep student authorization codes and guardian binding codes as separate types and records.
- Preserve desktop table readability with horizontal scrolling where needed.

---

### Task 1: Restore Student Management Navigation

**Files:**
- Modify: `src/navigation.ts`
- Modify: `src/navigation.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `NavTab` value `students` mapped to legacy view `students`.
- Consumes: existing `StudentView`, `initialParentGuardianships`, and `AuthCode[]` state.

- [ ] **Step 1: Extend the navigation test with the student route**

Add assertions that `navGroups` contains `{ id: 'students', label: '学生管理' }` and `resolveLegacyView('students') === 'students'`.

- [ ] **Step 2: Run the navigation test and verify failure**

Run: `npx tsx --test src/navigation.test.ts`

Expected: FAIL because `students` is not a valid navigation tab or mapping.

- [ ] **Step 3: Add the student navigation item and render StudentView**

Extend `NavTab` and `LegacyView`, add the sidebar item after institution operations, import `StudentView` and `initialParentGuardianships`, store guardianships in `App`, and render `StudentView` for the student legacy view.

Provide handlers that update guardianship status and show the existing report-generation demo feedback.

- [ ] **Step 4: Run the navigation test and type check**

Run: `npx tsx --test src/navigation.test.ts && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit the navigation slice**

```bash
git add src/navigation.ts src/navigation.test.ts src/App.tsx
git commit -m "feat: restore student management navigation"
```

### Task 2: Add Student Rights and Guardian Binding Codes

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/views/StudentView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `authCodes: AuthCode[]` and existing `students`/`guardianships` props.
- Produces: `GuardianBindingCode` with `id`, `code`, `studentId`, `studentName`, `institutionName`, `createdAt`, `expireAt`, and `status: 'pending' | 'bound' | 'expired'`.

- [ ] **Step 1: Add typed guardian binding-code records**

Define `GuardianBindingCode` in `src/types/index.ts`. In `StudentView`, seed bound demo records from active guardianships and initialize them once with `useState`.

- [ ] **Step 2: Add the Student Rights tab**

Extend `activeTab` with `rights`, add the “学生权益” tab, and render an overflow-safe table derived directly from `authCodes`. Map statuses to 已生效、待激活、已作废、已过期 and show activation/expiry dates.

- [ ] **Step 3: Add direct guardian binding-code generation**

Inside the guardianship tab, add a “生成家长绑定码” button. On click, create `JB-XXXX-XXXX`, target the first student, set a seven-day expiry and `pending` status, then prepend it to the binding-code records.

- [ ] **Step 4: Render binding-code records beside guardianships**

Add a separate table below the guardianship table with code, target student, institution, generation time, expiry and localized status. Include a clear empty state.

- [ ] **Step 5: Pass authorization codes from App and type check**

Run: `npm run lint`

Expected: PASS with the new required `authCodes` prop wired from `App`.

- [ ] **Step 6: Commit the student-management slice**

```bash
git add src/types/index.ts src/components/views/StudentView.tsx src/App.tsx
git commit -m "feat: add student rights and guardian binding codes"
```

### Task 3: Make Authorization-Code Generation Direct and Production-Named

**Files:**
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: existing `onGenerateCodeForTest(institutionName, teacherName, studentName, packageName)` callback until renamed.
- Produces: `onGenerateAuthCode(...)` callback with the same four string arguments.

- [ ] **Step 1: Rename the callback across App and GoodsView**

Rename `onGenerateCodeForTest` to `onGenerateAuthCode` and `handleGenerateCodeForTest` to `handleGenerateAuthCode` without changing the direct-generation behavior.

- [ ] **Step 2: Update visible labels and audit wording**

Rename “服务开通记录” to “授权码记录”, “生成测试授权码” to “生成授权码”, and the audit action to “生成学生授权码”. Use an existing student name from the demo dataset in the generated record.

- [ ] **Step 3: Verify no test-code wording remains in the active flow**

Run: `rg -n "生成测试授权码|测试生成.*授权码|onGenerateCodeForTest|handleGenerateCodeForTest" src/App.tsx src/components/views/GoodsView.tsx`

Expected: no matches.

- [ ] **Step 4: Run type check**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit the authorization-code slice**

```bash
git add src/components/views/GoodsView.tsx src/App.tsx
git commit -m "feat: streamline authorization code generation"
```

### Task 4: Split Knowledge-Point Metadata Columns

**Files:**
- Modify: `src/components/views/QuestionBankView.tsx`

**Interfaces:**
- Consumes: `flatKnowledgeRows` fields `subject`, `grade`, `textbook`, `l1Name`, `l2Name`, and `l3Name`.
- Produces: independent table columns for subject, stage, level 1, level 2, level 3 and textbook.

- [ ] **Step 1: Replace the combined metadata header**

Set the header order to 学科、学段、一级知识点、二级知识点、三级知识点、教材版本、关联精选题、快捷操作 and increase the empty-state `colSpan` to 8.

- [ ] **Step 2: Render each field independently**

Render `row.subject`, normalize `row.grade` with the existing education-stage formatter or helper, render all three knowledge-point names, and render `row.textbook` separately.

- [ ] **Step 3: Remove the unused combined formatter import if applicable**

Keep the existing education-stage utility only if it is used to derive the stage label; otherwise import the precise helper already exported by `src/utils/educationStage.ts`.

- [ ] **Step 4: Run type check and existing education-stage test**

Run: `npx tsx --test src/utils/educationStage.test.ts && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit the knowledge-table slice**

```bash
git add src/components/views/QuestionBankView.tsx
git commit -m "feat: split knowledge point table columns"
```

### Task 5: Full Verification and Visual Walkthrough

**Files:**
- Verify: `src/navigation.ts`
- Verify: `src/components/views/StudentView.tsx`
- Verify: `src/components/views/GoodsView.tsx`
- Verify: `src/components/views/QuestionBankView.tsx`

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: a buildable, browser-verified desktop prototype.

- [ ] **Step 1: Run all automated checks**

Run: `npm test` if available; otherwise run `npx tsx --test src/*.test.ts src/utils/*.test.ts`, then `npm run lint` and `npm run build`.

Expected: all tests pass, TypeScript emits no errors, and Vite produces `dist/`.

- [ ] **Step 2: Start the local app and inspect key flows**

Run: `npm run dev -- --host 127.0.0.1`

Check: Student Management opens; Student Rights renders; guardian binding code appears immediately after generation; authorization code appears immediately after generation; knowledge table has eight independent columns.

- [ ] **Step 3: Check responsive overflow and labels**

Confirm each table remains readable at the current desktop viewport, horizontal scrolling works where necessary, and no active UI uses “测试码”.

- [ ] **Step 4: Commit any verification fixes**

```bash
git add src
git commit -m "fix: polish student code management flows"
```
