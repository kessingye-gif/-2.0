# Global Master Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create globally editable education master data, reusable selectors and form components, then migrate system settings and key business forms to the shared source.

**Architecture:** A root `MasterDataProvider` owns reducer state for stages, grades, subjects, textbooks and knowledge types. Pure selectors and validators remain framework-independent; reusable React selects consume the context. Existing business records keep name snapshots while new choices come from active master data.

**Tech Stack:** React 19 Context/reducer, TypeScript 5.8, Node test runner, Vite 6.

## Global Constraints

- Keep all changes uncommitted.
- Add no third-party state dependency and no persistence.
- Preserve historical name snapshots in existing records.
- Active master data drives new/edit forms; inactive values remain displayable in history.

---

### Task 1: Master data domain and reducer

**Files:** Create `src/masterData/types.ts`, `initialData.ts`, `masterData.ts`, and tests.

- [ ] Write failing tests for active sorting, stage relations, duplicate validation, add, update and status toggle.
- [ ] Implement typed initial data, selectors, validation and reducer.
- [ ] Run focused tests.

### Task 2: Global provider and common selects

**Files:** Create `src/masterData/MasterDataContext.tsx`, `src/components/masterData/MasterDataSelects.tsx`; modify `src/main.tsx`.

- [ ] Add Provider and guarded `useMasterData()` hook.
- [ ] Add StageSelect, GradeSelect, SubjectSelect and TextbookSelect.
- [ ] Wrap the application root.
- [ ] Run TypeScript checks.

### Task 3: Editable system master-data workspace

**Files:** Create `src/components/masterData/MasterDataManager.tsx`; modify `src/components/views/SystemView.tsx` and tests.

- [ ] Replace hard-coded summary cards with five data tabs.
- [ ] Support add, edit and enable/disable with relation fields and duplicate feedback.
- [ ] Keep knowledge types in the global provider and preserve usage-count restrictions.
- [ ] Verify settings rendering and cross-page state updates.

### Task 4: Migrate business option sources

**Files:** Modify content, question bank, teacher/class and student views where they create or filter by education metadata.

- [ ] Replace hard-coded stage/grade/subject/textbook selects in active create/edit flows with common components.
- [ ] Feed ContentPackageManager subjects from shared master data.
- [ ] Order StudentView grade filters by global active-grade order while intersecting actual students.
- [ ] Preserve historical values that are not currently active.

### Task 5: Verification

- [ ] Run all tests, TypeScript checks and production build.
- [ ] Browser-check System Settings edits and immediate visibility in a business selector.
- [ ] Keep all changes uncommitted and report the workspace status.
