# Remove Redundant Page Headings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove repeated eyebrow, page title, and explanatory copy blocks from all top-level workspaces where navigation already identifies the page.

**Architecture:** Keep navigation tabs, action bars, statistics, tables, and meaningful section/card headings unchanged. Remove only top-level identity headers from the dashboard, goods, institution, system, exception, and audit workspaces, then tighten their root spacing.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner.

## Global Constraints

- Do not remove functional section headings inside cards, tables, drawers, or dialogs.
- Do not commit the changes; the user will combine them with their own edits.

---

### Task 1: Lock the streamlined layout in tests

**Files:**
- Modify: `src/commercialFlow.test.ts`
- Modify: `src/components/views/GoodsView.test.ts`
- Modify: `src/components/views/InstitutionView.test.ts`
- Modify: `src/components/views/DashboardView.test.ts`
- Modify: `src/components/views/SystemView.test.ts`

- [ ] Assert that top-level duplicate headings no longer render while functional tabs and sections remain.
- [ ] Run the focused tests and confirm they fail before implementation.

### Task 2: Remove duplicate top-level identity headers

**Files:**
- Modify: `src/components/views/DashboardView.tsx`
- Modify: `src/components/views/GoodsView.tsx`
- Modify: `src/components/views/InstitutionView.tsx`
- Modify: `src/components/views/SystemView.tsx`
- Modify: `src/components/views/AuditLogView.tsx`

- [ ] Remove only the eyebrow/title/description blocks.
- [ ] Reduce root spacing so the first functional element starts near the top.
- [ ] Run focused tests, type checking, full tests, and production build.

