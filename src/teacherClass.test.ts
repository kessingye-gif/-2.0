import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { TeacherClassView, filterClassesForViewer } from './components/views/TeacherClassView';
import { initialInstitutions, initialServicePackages, initialTeachers } from './mockData';
import { MasterDataProvider } from './masterData/MasterDataContext';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentProps } from 'react';

const renderTeacherClassView = (props: ComponentProps<typeof TeacherClassView>) => renderToStaticMarkup(
  createElement(MemoryRouter, null, createElement(MasterDataProvider, null, createElement(TeacherClassView, props))),
);

test('超级管理员可从教师模块新增教师', () => {
  const markup = renderTeacherClassView({
      institutions: initialInstitutions, teachers: initialTeachers, packages: initialServicePackages, creditLedger: [],
      onAddTeacher: () => undefined, onAddTeachers: () => undefined, onUpdateTeacher: () => undefined,
      onTransferTeacherCredits: () => undefined, onFulfillServices: () => undefined,
    });
  assert.match(markup, /新增老师/);
  assert.match(markup, /教师管理（3）/);
});

test('班级管理展示班主任点数并提供花名册和批量办理服务入口', () => {
  const markup = renderTeacherClassView({
      institutions: initialInstitutions, teachers: initialTeachers, packages: initialServicePackages, creditLedger: [],
      onAddTeacher: () => undefined, onAddTeachers: () => undefined, onUpdateTeacher: () => undefined,
      onTransferTeacherCredits: () => undefined, onFulfillServices: () => undefined,
      initialTab: 'classes', students: [],
    });

  assert.match(markup, /班主任可用点数/);
  assert.match(markup, /查看花名册/);
  assert.match(markup, /批量办理服务/);
});

test('学生导入只建立花名册和责任关系，不分配机构点数', () => {
  const source = readFileSync(new URL('./components/views/TeacherClassView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /默认每名学员划拨|初始划拨额度|微调学员初始额度|学生.*Token/);
  assert.match(source, /导入只建立花名册和责任关系/);
  assert.match(source, /同时给班主任分配点数/);
});

test('教师只看到自己的班级，机构管理员只看到本机构班级', () => {
  const classes = [
    { id: 'C-1', institutionId: 'I-1', headTeacherId: 'T-1' },
    { id: 'C-2', institutionId: 'I-1', headTeacherId: 'T-2' },
    { id: 'C-3', institutionId: 'I-2', headTeacherId: 'T-3' },
  ];
  assert.deepEqual(filterClassesForViewer(classes, 'teacher', 'I-1', 'T-1').map((item) => item.id), ['C-1']);
  assert.deepEqual(filterClassesForViewer(classes, 'institution_admin', 'I-1').map((item) => item.id), ['C-1', 'C-2']);
  assert.equal(filterClassesForViewer(classes, 'super_admin').length, 3);
});

test('教师班级页面数量只计算本人负责班级', () => {
  const markup = renderTeacherClassView({
    institutions: initialInstitutions.slice(0, 1), teachers: initialTeachers.slice(0, 1), packages: initialServicePackages, creditLedger: [], students: [],
    onAddTeacher: () => undefined, onAddTeachers: () => undefined, onUpdateTeacher: () => undefined,
    onTransferTeacherCredits: () => undefined, onFulfillServices: () => undefined,
    initialTab: 'classes', viewerRole: 'teacher', viewerInstitutionId: 'INS-2023001', viewerTeacherId: 'TCH-001',
  });
  assert.match(markup, /班级管理（1）/);
  assert.doesNotMatch(markup, /班级管理（3）/);
});
