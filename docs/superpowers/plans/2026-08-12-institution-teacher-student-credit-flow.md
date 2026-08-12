# Institution–Teacher–Student Credit Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make institution credits, teacher balances, class operations, student service rights, and the two binding codes one consistent prototype journey.

**Architecture:** Lift teacher accounts to the application state so institution allocation and student fulfillment update one source of truth. Keep classes as an operational scope rather than a credit wallet. Derive legacy student rights from existing authorization codes, while every new fulfillment transaction creates a right, student authorization code, guardian binding code, teacher debit, and audit record together.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Node test runner.

## Global Constraints

- Institution and teacher accounts may hold procurement credits; students and classes may not.
- Allocating credits to a teacher debits the institution and credits the teacher by the same amount.
- Fulfilling a service package debits only the responsible teacher and creates student rights plus both codes.
- Existing authorization codes must remain visible in student details even when legacy right records are missing.
- No git commit in this round.

---

### Task 1: Add tested credit-domain transactions

**Files:**
- Create: `src/domain/teacherCredits.ts`
- Create: `src/domain/teacherCredits.test.ts`
- Modify: `src/types/index.ts`

- [ ] Test institution-to-teacher allocation, insufficient balance, reclaim limits, and teacher service debit.
- [ ] Implement pure transaction functions returning updated records and immutable ledger entries.

### Task 2: Seed shared teachers and legacy service rights

**Files:**
- Modify: `src/mockData.ts`
- Create: `src/domain/studentRights.ts`
- Create: `src/domain/studentRights.test.ts`
- Modify: `src/App.tsx`

- [ ] Test deriving a student right from every legacy authorization code.
- [ ] Move initial teachers to shared mock data and initialize rights from existing codes.

### Task 3: Wire teacher allocation and fulfillment to shared state

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/views/TeacherClassView.tsx`
- Modify: `src/components/fulfillment/ServiceFulfillmentPanel.tsx`

- [ ] Pass teachers and allocation callbacks into the teacher/class workspace.
- [ ] Make teacher allocation debit the institution account.
- [ ] Validate and debit the responsible teacher when a student service is fulfilled.

### Task 4: Add class convenience operations

**Files:**
- Modify: `src/components/views/TeacherClassView.tsx`
- Modify: `src/teacherClass.test.ts`

- [ ] Add optional teacher-credit allocation to class creation with before/after institution balance.
- [ ] Show the head teacher balance in class management and offer a direct allocation action.
- [ ] Add a class-roster bulk service dialog that calculates total teacher debit and blocks insufficient balances.

### Task 5: Consolidate student details and verify

**Files:**
- Modify: `src/components/views/StudentView.tsx`
- Modify: `src/components/views/StudentView.test.ts`

- [ ] Show rights and both codes for legacy and newly fulfilled students with real lifecycle status.
- [ ] Run all tests, type checking, build, and browser acceptance checks.

