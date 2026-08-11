import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { TeacherClassView } from './components/views/TeacherClassView';
import { initialInstitutions } from './mockData';
import { MasterDataProvider } from './masterData/MasterDataContext';

test('超级管理员可从教师模块批量导入教师', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null,
    createElement(TeacherClassView, { institutions: initialInstitutions })
  ));
  assert.match(markup, /批量导入教师/);
  assert.match(markup, /新增教师账号/);
});

test('学生导入只建立花名册和责任关系，不分配机构点数', () => {
  const source = readFileSync(new URL('./components/views/TeacherClassView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /默认每名学员划拨|初始划拨额度|微调学员初始额度|学生.*Token/);
  assert.match(source, /导入只建立花名册和责任关系/);
});
