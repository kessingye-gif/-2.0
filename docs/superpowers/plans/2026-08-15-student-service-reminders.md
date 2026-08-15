# 学生服务自动提醒卡片 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在学生详情中为待激活和即将到期的服务权益显示自动提醒，并支持当前会话内标记已处理。

**Architecture:** 在 `src/domain/serviceReminders.ts` 中从现有 `StudentServiceRight` 派生纯提醒数据，不改变权益状态或新增持久化数据。`StudentView` 用该函数在学生详情抽屉展示卡片，并以本地 React 状态隐藏已处理的提醒。

**Tech Stack:** React 19、TypeScript、Node test runner (`tsx --test`)、Tailwind CSS。

## Global Constraints

- 不新增后端接口、数据库字段、导航入口或手动创建提醒。
- 仅使用 `StudentServiceRight` 的状态、创建时间、到期时间、服务包名称。
- 已处理仅在当前前端会话生效；不修改权益、AI 用量或服务状态。
- 日期以调用方传入的本地日期为准；待激活阈值为 3 天、续办提醒窗口为 7 天。

---

### Task 1: 建立服务提醒领域计算

**Files:**
- Create: `src/domain/serviceReminders.ts`
- Test: `src/domain/serviceReminders.test.ts`

**Interfaces:**
- Consumes: `StudentServiceRight` from `src/types/index.ts`。
- Produces: `deriveStudentServiceReminders(rights: StudentServiceRight[], now: Date): StudentServiceReminder[]`。
- `StudentServiceReminder` 包含 `id`、`rightId`、`studentId`、`packageName`、`kind`、`title`、`description`。

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveStudentServiceReminders } from './serviceReminders';

test('待激活满三天的权益生成激活提醒', () => {
  const reminders = deriveStudentServiceReminders([
    { id: 'RIGHT-1', studentId: 'STU-1', studentName: '张三', institutionId: 'INS-1', institutionName: '机构', teacherId: 'T-1', teacherName: '老师', packageId: 'PKG-1', packageName: '标准包', authCodeId: 'AUTH-1', includedAiUsage: 100, quotaConsumed: 10, createdAt: '2026-08-01T00:00:00.000Z', serviceExpireAt: null, status: 'pending' },
  ], new Date('2026-08-04T00:00:00.000Z'));

  assert.deepEqual(reminders.map((item) => item.kind), ['activation']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/serviceReminders.test.ts`

Expected: FAIL because `./serviceReminders` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export type StudentServiceReminderKind = 'activation' | 'renewal' | 'expired';

export interface StudentServiceReminder {
  id: string;
  rightId: string;
  studentId: string;
  packageName: string;
  kind: StudentServiceReminderKind;
  title: string;
  description: string;
}

export function deriveStudentServiceReminders(rights: StudentServiceRight[], now: Date): StudentServiceReminder[] {
  // pending 且 createdAt 至少三天前：activation
  // active 且 serviceExpireAt 在未来 0–7 天内：renewal
  // expired：expired
}
```

使用 `right.id + kind` 生成稳定提醒 ID；`serviceExpireAt === null` 的长期权益不生成续办提醒。

- [ ] **Step 4: Extend the test matrix**

在同一测试文件新增并断言：

```ts
test('七天内到期的服务中权益生成续办提醒', () => {
  // active, serviceExpireAt: '2026-08-21', now: '2026-08-15'
});

test('已到期权益生成到期提醒', () => {
  // expired
});

test('未满足任何规则的权益不生成提醒', () => {
  // 两天前 pending、八天后到期 active、revoked
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/domain/serviceReminders.test.ts`

Expected: all four reminder tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/serviceReminders.ts src/domain/serviceReminders.test.ts
git commit -m "feat: derive student service reminders"
```

### Task 2: 在学生详情显示并处理提醒

**Files:**
- Modify: `src/components/views/StudentView.tsx:1-70, 337-385`
- Test: `src/components/views/StudentView.test.ts`

**Interfaces:**
- Consumes: `deriveStudentServiceReminders(rights, new Date())` and `StudentServiceReminder` from Task 1.
- Produces: 学生详情内的“待跟进提醒”区块；点击“标记已处理”后将提醒 ID 加入本地 `Set<string>`。

- [ ] **Step 1: Write the failing UI test**

```ts
test('学生详情为命中规则的服务权益显示待跟进提醒', () => {
  const markup = renderStudentView({
    serviceRights: [pendingRightCreatedThreeDaysAgo],
  });

  assert.match(markup, /待跟进提醒/);
  assert.match(markup, /联系学生完成激活/);
  assert.match(markup, /标记已处理/);
});
```

测试使用 `StudentView` 现有 SSR 渲染辅助；若详情抽屉需要交互才会打开，则将提醒区块抽成接收 `rights` 的小组件，并在测试中直接渲染该组件。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/views/StudentView.test.ts`

Expected: FAIL because the reminder heading and action are absent.

- [ ] **Step 3: Write minimal UI implementation**

在 `StudentView` 中：

```ts
const [dismissedReminderIds, setDismissedReminderIds] = useState<Set<string>>(() => new Set());
const serviceReminders = useMemo(
  () => deriveStudentServiceReminders(mergedServiceRights, new Date()),
  [mergedServiceRights],
);
```

在详情抽屉“服务权益”区块之后插入仅在当前学生有未处理提醒时出现的 section。每条卡片显示 `title`、`packageName`、`description` 和“标记已处理”按钮；按钮使用不可变写法创建新的 `Set`。不添加提醒时显示空态卡片或页面级提示。

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/views/StudentView.test.ts`

Expected: student reminder UI test PASS and existing student-view tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/StudentView.tsx src/components/views/StudentView.test.ts
git commit -m "feat: show student service reminders"
```

### Task 3: 完整验证

**Files:**
- Verify only.

- [ ] **Step 1: Run the full suite and production build**

Run: `npm test && npm run lint && npm run build`

Expected: all tests PASS, TypeScript has no errors, Vite production build succeeds.

- [ ] **Step 2: Perform manual browser verification**

打开学生管理，进入一名具有待激活、即将到期或已到期权益的学生详情。确认提醒位于服务权益下方；点击“标记已处理”后该条卡片消失，权益状态和 AI 用量保持不变。

- [ ] **Step 3: Commit verification-ready final state**

```bash
git status --short
```

Expected: no uncommitted product changes remain.
