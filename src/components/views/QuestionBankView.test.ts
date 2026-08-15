import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('只有超级管理员能看到新增内容包按钮，题库页不显示独立导入和录入入口', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /canCreateContentPackage && activeSubTab === 'contentPackages'/);
  assert.doesNotMatch(source, /setIsBatchImportOpen\(true\)[\s\S]{0,400}<span>批量导入<\/span>/);
  assert.doesNotMatch(source, /onClick=\{handleOpenAddQuestion\}[\s\S]{0,400}<span>录入试题<\/span>/);
});
