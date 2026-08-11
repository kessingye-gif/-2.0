# Student Shared Data Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add institution, teacher, and grade cascading filters to Student Management while preserving `App.students` as the shared source of truth.

**Architecture:** Add pure filtering and option-derivation helpers under `src/utils`, cover them with Node tests, and keep only selected filter state in `StudentView`. Merge the verified feature branch into `main` after removing only the known accidental main-branch changes created during this task.

**Tech Stack:** React 19, TypeScript 5.8, Node test runner, Vite 6.

## Global Constraints

- Do not duplicate student records inside `StudentView`.
- Derive all filter options from the current `students` prop.
- Reset teacher and grade when institution changes; reset grade when teacher changes.
- Run the full test suite, TypeScript check, and production build before merging.

---

### Task 1: Test and implement student filter helpers

**Files:** Create `src/utils/studentFilters.ts`; create `src/utils/studentFilters.test.ts`.

- [ ] Write failing tests for institution options, teacher options scoped by institution, grade options scoped by institution and teacher, and combined filtering.
- [ ] Run the focused test and confirm it fails because the helper module is absent.
- [ ] Implement `getStudentFilterOptions(students, filters)` and `filterStudents(students, filters)`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Add cascading controls to StudentView

**Files:** Modify `src/components/views/StudentView.tsx`.

- [ ] Add institution, teacher, and grade state.
- [ ] Replace the inline roster filter with the tested helper.
- [ ] Render the three selects, reset dependent state on change, add clear-filter action and empty state.
- [ ] Run TypeScript checks.

### Task 3: Verify and merge

**Files:** Verify all changed source files and repository state.

- [ ] Run all tests, TypeScript checks, and production build on `feat/commercial-fulfillment-demo`.
- [ ] Walk through the cascading filters in the local browser.
- [ ] Commit the implementation.
- [ ] Preserve a patch of accidental main work, remove only agent-created accidental main changes, and merge `feat/commercial-fulfillment-demo` into `main`.
- [ ] Re-run tests and build on merged `main`.
