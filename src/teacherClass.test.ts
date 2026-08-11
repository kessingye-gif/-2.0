import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeacherClassView } from './components/views/TeacherClassView';
import { initialInstitutions } from './mockData';

test('超级管理员可从教师模块批量导入教师', () => {
  const markup = renderToStaticMarkup(createElement(TeacherClassView, { institutions: initialInstitutions }));
  assert.match(markup, /批量导入教师/);
  assert.match(markup, /新增教师账号/);
});
