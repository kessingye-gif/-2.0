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

test('内容包顶部数量只统计正常可使用的内容包', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /initialContentPackages\.filter\(\(pkg\) => pkg\.status === 'active'\)\.length/);
  assert.match(source, /内容包 \(\{activeContentPackageCount\}\)/);
  assert.match(source, /onActivePackageCountChange=\{setActiveContentPackageCount\}/);
});

test('题库导入弹窗不向正式后台展示内部拆分原理', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /1行数据拆分为双表原理展示/);
  assert.doesNotMatch(source, /后台存储自动拆分为两张关联表/);
});

test('题库导入使用面向操作的文案', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /导入精选题库/);
  assert.match(source, /上传 Excel 题库/);
  assert.doesNotMatch(source, /单表同行上传 ➔ 后台自动拆分存为两张关联表/);
  assert.doesNotMatch(source, /选择 Excel 单表或一键测试/);
});

test('题库导入在上传前明确提示分隔符和空值规则', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /多选答案<\/b> 用；分隔/);
  assert.match(source, /填空\/解答题<\/b> 选项填 -/);
  assert.match(source, /题干\/选项图片<\/b> 无则留空/);
});

test('知识点导入保留填写提醒，隐藏内部试用和规范页', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /导入知识点/);
  assert.match(source, /上传 Excel 知识点/);
  assert.match(source, /知识点<\/b> 无则填 -/);
  assert.match(source, /前置知识点<\/b> 无则填 -/);
  assert.doesNotMatch(source, /章、节、知识点表结构规范说明/);
  assert.doesNotMatch(source, /一键试用多学科知识点层级批量导入/);
});

test('题库筛选和录入统一使用公共题型字典组件', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /QuestionTypeSelect/);
  assert.equal(source.match(/<QuestionTypeSelect/g)?.length, 2);
  assert.doesNotMatch(source, /<option value="单选题">/);
  assert.doesNotMatch(source, /<option value="多选题">/);
});

test('题库学科筛选读取基础字典公共组件', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  const filterSource = source.slice(source.indexOf('学科筛选'), source.indexOf('难度等级'));
  assert.match(source, /<SubjectSelect value=\{subjectFilter\}/);
  assert.match(source, /emptyLabel="全部学科"/);
  assert.doesNotMatch(filterSource, /<option/);
});

test('新增内容包将学段、学科和教材版本拆为三个基础字典字段', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  const modalSource = source.slice(source.indexOf('{/* Add / Edit Package Modal */}'));
  assert.match(modalSource, /<StageSelect required/);
  assert.match(modalSource, /<SubjectSelect required stageId=\{packageForm\.stageId \|\| undefined\}/);
  assert.match(modalSource, /<TextbookSelect required stageId=\{packageForm\.stageId \|\| undefined\}/);
  assert.doesNotMatch(modalSource, /disabled=\{!packageForm\.stageId\}/);
  assert.doesNotMatch(modalSource, /\{subject\.name\} · \{subject\.stage\} · \{subject\.textbook\}/);
});

test('知识点默认按内容包式树状层级展开', () => {
  const source = readFileSync(new URL('./QuestionBankView.tsx', import.meta.url), 'utf8');
  assert.match(source, /useState<'table' \| 'tree'>\('tree'\)/);
  assert.match(source, /setTreeViewMode\('tree'\); handleExpandAllNodes\(\)/);
  assert.match(source, /value=\{treeSubjectFilter\}[\s\S]*valueMode="name"/);
});
