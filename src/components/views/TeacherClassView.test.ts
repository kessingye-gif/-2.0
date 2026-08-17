import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { MasterDataProvider } from '../../masterData/MasterDataContext';
import { initialInstitutions, initialServicePackages, initialStudents, initialTeachers } from '../../mockData';
import { TeacherClassView } from './TeacherClassView';

test('总部教师维护只管理归属，不再展示教师点数账户', () => {
  const markup = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/platform/teachers'] },
    createElement(MasterDataProvider, null, createElement(TeacherClassView, {
      institutions: initialInstitutions,
      teachers: initialTeachers,
      packages: initialServicePackages,
      creditLedger: [],
      students: initialStudents,
      onAddTeacher: () => undefined,
      onAddTeachers: () => undefined,
      onUpdateTeacher: () => undefined,
      onTransferTeacherCredits: () => undefined,
      onFulfillServices: () => undefined,
      initialTab: 'teachers',
      viewerRole: 'super_admin',
    }))
  ));

  assert.match(markup, /教师仅用于用户归属、筛选和分组/);
  assert.doesNotMatch(markup, /点数账户|划拨点数|新增老师后，额度/);
});

test('总部班级卡片不再展示班主任点数', () => {
  const markup = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/platform/classes'] },
    createElement(MasterDataProvider, null, createElement(TeacherClassView, {
      institutions: initialInstitutions, teachers: initialTeachers, packages: initialServicePackages,
      creditLedger: [], students: initialStudents, onAddTeacher: () => undefined, onAddTeachers: () => undefined,
      onUpdateTeacher: () => undefined, onTransferTeacherCredits: () => undefined, onFulfillServices: () => undefined,
      initialTab: 'classes', viewerRole: 'super_admin',
    }))
  ));

  assert.match(markup, /服务开通由机构账户统一结算/);
  assert.doesNotMatch(markup, /班主任可用点数/);
});
