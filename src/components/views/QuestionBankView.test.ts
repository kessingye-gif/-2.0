import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('只有超级管理员能看到新增内容包按钮，精选题库保留导入和录入入口', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /canCreateContentPackage && activeSubTab === 'contentPackages'/);
  assert.match(source, /activeSubTab === 'questions'/);
  assert.match(source, /<span>批量导入<\/span>/);
  assert.match(source, /<span>录入试题<\/span>/);
});
