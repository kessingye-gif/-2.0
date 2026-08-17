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

test('题库导入弹窗不向正式后台展示内部拆分原理', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /1行数据拆分为双表原理展示/);
  assert.doesNotMatch(source, /后台存储自动拆分为两张关联表/);
});

test('题库导入在上传前明确提示分隔符和空值规则', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /多选答案<\/b> 用；分隔/);
  assert.match(source, /填空\/解答题<\/b> 选项填 -/);
  assert.match(source, /题干\/选项图片<\/b> 无则留空/);
});
