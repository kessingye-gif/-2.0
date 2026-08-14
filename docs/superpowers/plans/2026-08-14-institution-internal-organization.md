# 机构内部组织管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使机构管理成为校区、年级组、班级及其成员的内部运营入口，消除与服务开通重复的主体维护。

**Architecture:** 在共享类型中建立组织节点与成员归属；将层级查询和逐级筛选置于纯函数；机构详情承载组织树，教师/学生/班级页面只消费既有主体和组织归属。

**Tech Stack:** React、TypeScript、Node test、Vite。

## Global Constraints

- 服务开通只创建初始服务关系，不重复创建机构、教师或学生。
- 组织层级固定为校区、年级组、班级，并归属唯一机构。
- 教师、学生视图必须以机构范围为前提。

---

### Task 1: 组织模型与层级筛选

**Files:** `src/types/index.ts`, `src/utils/organization.ts`, `src/utils/organization.test.ts`, `src/mockData.ts`

- [ ] 写入校区、年级组、班级归属及逐级筛选的失败测试；运行 `npm test -- src/utils/organization.test.ts`，预期失败。
- [ ] 建立 `OrganizationNode`、`getOrganizationChildren`、`filterOrganizationMembers`，给现有教师与学生补可选组织 ID；运行同一测试，预期通过。
- [ ] 提交：`git commit -m "feat: model institution organization"`。

### Task 2: 机构内部组织入口

**Files:** `src/components/views/InstitutionView.tsx`, `src/components/views/InstitutionView.test.tsx`

- [ ] 写入“机构详情展示校区—年级组—班级树及组织管理入口”的失败测试；运行对应测试，预期失败。
- [ ] 在机构行/详情加入组织管理；展示机构管理员、授权额度与可展开的组织树，提供新增节点和班级成员入口；运行测试，预期通过。
- [ ] 提交：`git commit -m "feat: manage institution organization tree"`。

### Task 3: 统一教师、学生、班级运营页

**Files:** `src/components/views/TeacherClassView.tsx`, `src/components/views/StudentView.tsx`, 相应测试

- [ ] 写入“机构过滤后校区、年级组、班级逐级收窄”和“班级页面只编排已有师生”的失败测试；运行对应测试，预期失败。
- [ ] 移除重复开户字段与创建主体入口，添加组织筛选、成员编排和服务状态展示；运行测试，预期通过。
- [ ] 运行 `npm test && npm run lint && npm run build`；提交：`git commit -m "feat: align institution member operations"`。
