import assert from 'node:assert/strict';
import test from 'node:test';
import { buildImportTemplateSheets } from './downloadImportTemplate';

test('精选题库下载模板保持单表并覆盖主要题型的案例', () => {
  const sheets = buildImportTemplateSheets('questions');

  assert.equal(sheets.length, 1);
  assert.equal(sheets[0].name, '题库导入');
  assert.match(String(sheets[0].rows.flat()), /单选题/);
  assert.match(String(sheets[0].rows.flat()), /多选题/);
  assert.match(String(sheets[0].rows.flat()), /填空题/);
  assert.match(String(sheets[0].rows.flat()), /解答题/);
});

test('学生模板允许负责教师和班级选填', () => {
  const sheets = buildImportTemplateSheets('classStudents');
  assert.equal(sheets[0].name, '学生导入');
  assert.deepEqual(sheets[0].rows[0], ['学生姓名', '登录账号', '登录密码', '手机号', '负责教师姓名（选填）', '年级', '班级（选填）']);
});
