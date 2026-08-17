# 统一账号与认证规则 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让平台管理员、机构管理员、教师和学生统一使用账号密码，手机号只作可选绑定。

**Architecture:** 新增独立凭据模块作为唯一校验入口；`App.tsx` 保存可登录账号，登录页与管理页共享该数据。机构、教师、学生保留业务数据，同时补齐统一凭据字段。

**Tech Stack:** React、TypeScript、node:test、`src/utils/password.ts`。

## Global Constraints

- 账号和密码是新增登录账号的必填项，密码必须满足现有 12 位强度规则。
- 手机号仅用于验证码登录、找回密码与安全验证，允许为空。
- 登录仅允许精确匹配已启用账号和密码。
- 不新增第三方认证依赖。

---

### Task 1: 创建统一凭据校验

**Files:**
- Create: `src/domain/accountCredentials.ts`
- Create: `src/domain/accountCredentials.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('账号密码必填，手机号可空', () => {
  assert.equal(validateAccountCredentials({ username: 'teacher_01', password: 'Abcd!2345678', phone: '' }), '');
  assert.equal(validateAccountCredentials({ username: 'teacher_01', password: '', phone: '' }), '请设置登录密码');
});

test('认证仅接受已启用账号的精确密码', () => {
  const accounts = [{ id: 'A1', username: 'admin', password: 'Abcd!2345678', status: 'active' as const }];
  assert.equal(authenticateAccount(accounts, 'admin', 'Abcd!2345678')?.id, 'A1');
  assert.equal(authenticateAccount(accounts, 'admin-x', 'Abcd!2345678'), undefined);
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- src/domain/accountCredentials.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement and verify**

Implement `AccountCredential`, `validateAccountCredentials`, and `authenticateAccount`; call `getPasswordValidationMessage` for strength checks, and find only `status === 'active'` exact username/password matches.

Run: `npm test -- src/domain/accountCredentials.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/domain/accountCredentials.ts src/domain/accountCredentials.test.ts
git commit -m "feat: add unified account credential rules"
```

### Task 2: 统一平台管理员账号数据源

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/views/SystemView.tsx`
- Modify: `src/components/masterData/MasterDataManager.tsx`
- Test: `src/components/masterData/MasterDataManager.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('管理员手机号可选且凭据复用统一校验', () => {
  assert.match(source, /validateAccountCredentials/);
  assert.match(source, /手机号（可选）/);
  assert.doesNotMatch(source, /!form\.phone\.trim\(\)/);
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- src/components/masterData/MasterDataManager.test.ts`

Expected: FAIL because the component owns局部账号数据并要求手机号。

- [ ] **Step 3: Implement and verify**

Move platform admin accounts into `App.tsx`; pass accounts and save/reset callbacks through `SystemView` to `AdminAccountManager`. Require account/password on creation, allow blank optional phone, and show `未绑定` for blank phone.

Run: `npm test -- src/components/masterData/MasterDataManager.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/views/SystemView.tsx src/components/masterData/MasterDataManager.tsx src/components/masterData/MasterDataManager.test.ts
git commit -m "feat: centralize platform admin credentials"
```

### Task 3: 收紧后台登录

**Files:**
- Modify: `src/components/auth/LoginView.tsx`
- Modify: `src/App.tsx`
- Create: `src/components/auth/LoginView.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('登录页仅执行精确账号密码认证', () => {
  assert.match(source, /authenticateAccount/);
  assert.doesNotMatch(source, /includes\(i\.code/);
  assert.match(source, /账号密码为必备登录方式/);
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- src/components/auth/LoginView.test.ts`

Expected: FAIL because current login ignores password and允许模糊机构匹配。

- [ ] **Step 3: Implement and verify**

Compose global admins and institution admins into login records in `App.tsx`; authenticate using Task 1; show an error for unknown, disabled, or wrong-password accounts; update login copy to account/password first and phone optional.

Run: `npm test -- src/components/auth/LoginView.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/auth/LoginView.tsx src/components/auth/LoginView.test.ts
git commit -m "fix: require exact account password login"
```

### Task 4: 接入机构管理员创建和重置

**Files:**
- Modify: `src/components/views/InstitutionView.tsx`
- Test: `src/components/views/InstitutionView.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('机构管理员账号复用凭据校验且手机号可选', () => {
  assert.match(source, /validateAccountCredentials/);
  assert.match(source, /绑定手机号（可选）/);
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- src/components/views/InstitutionView.test.ts`

Expected: FAIL because current form has单独校验与必填联系电话。

- [ ] **Step 3: Implement and verify**

Use Task 1 validation for institution creation and account-password reset; change account-management phone wording to “绑定手机号（可选）”; retain existing institution contact information as non-login business data.

Run: `npm test -- src/components/views/InstitutionView.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/InstitutionView.tsx src/components/views/InstitutionView.test.ts
git commit -m "feat: unify institution administrator credentials"
```

### Task 5: 教师和学生补齐凭据

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/views/TeacherClassView.tsx`
- Modify: `src/components/views/StudentView.tsx`
- Modify: `src/App.tsx`
- Test: `src/teacherClass.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('新增教师要求强密码，手机号可空', () => {
  assert.match(source, /validateAccountCredentials/);
  assert.doesNotMatch(source, /!teacherForm\.phone/);
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- src/teacherClass.test.ts`

Expected: FAIL because current teacher form没有密码并要求手机号。

- [ ] **Step 3: Implement and verify**

Add persisted password and optional phone to teacher/student login entities; add initial-password input and random generation to manual creation; generate valid passwords for batch demonstrations while preserving all class, institution, and service fields.

Run: `npm test -- src/teacherClass.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/components/views/TeacherClassView.tsx src/components/views/StudentView.tsx src/App.tsx src/teacherClass.test.ts
git commit -m "feat: require credentials for teacher and student accounts"
```

### Task 6: 回归验证

**Files:**
- Modify: `src/domain/accountCredentials.test.ts`
- Modify: `src/components/auth/LoginView.test.ts`

- [ ] **Step 1: Add regression cases**

```ts
test('停用账号和错误密码均不能登录', () => {
  assert.equal(authenticateAccount([{ id: 'A1', username: 'closed', password: 'Abcd!2345678', status: 'inactive' }], 'closed', 'Abcd!2345678'), undefined);
  assert.equal(authenticateAccount([{ id: 'A1', username: 'active', password: 'Abcd!2345678', status: 'active' }], 'active', 'wrong'), undefined);
});
```

- [ ] **Step 2: Run full verification**

Run: `npm test && npm run lint`

Expected: all tests pass and TypeScript exits with code 0.

- [ ] **Step 3: Commit**

```bash
git add src/domain/accountCredentials.test.ts src/components/auth/LoginView.test.ts
git commit -m "test: cover unified account authentication"
```
