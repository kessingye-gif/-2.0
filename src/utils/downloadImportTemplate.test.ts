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
