import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { TeacherClassView } from './components/views/TeacherClassView';
import { initialInstitutions, initialServicePackages, initialTeachers } from './mockData';
import { MasterDataProvider } from './masterData/MasterDataContext';

test('超级管理员可从教师模块批量导入教师', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null,
    createElement(TeacherClassView, {
      institutions: initialInstitutions, teachers: initialTeachers, packages: initialServicePackages, creditLedger: [],
      onAddTeacher: () => undefined, onAddTeachers: () => undefined, onUpdateTeacher: () => undefined,
      onTransferTeacherCredits: () => undefined, onFulfillServices: () => undefined,
    })
  ));
  assert.match(markup, /批量导入教师/);
  assert.match(markup, /新增教师账号/);
});

test('班级管理展示班主任点数并提供追加点数和批量办理服务入口', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null,
    createElement(TeacherClassView, {
      institutions: initialInstitutions, teachers: initialTeachers, packages: initialServicePackages, creditLedger: [],
      onAddTeacher: () => undefined, onAddTeachers: () => undefined, onUpdateTeacher: () => undefined,
      onTransferTeacherCredits: () => undefined, onFulfillServices: () => undefined,
      initialTab: 'classes', students: [],
    })
  ));

  assert.match(markup, /班主任可用点数/);
  assert.match(markup, /追加点数/);
  assert.match(markup, /批量办理服务/);
});

test('学生导入只建立花名册和责任关系，不分配机构点数', () => {
  const source = readFileSync(new URL('./components/views/TeacherClassView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /默认每名学员划拨|初始划拨额度|微调学员初始额度|学生.*Token/);
  assert.match(source, /导入只建立花名册和责任关系/);
  assert.match(source, /同时给班主任分配点数/);
});
