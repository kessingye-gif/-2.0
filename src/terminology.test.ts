import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('业务页面不向客户展示技术词 Token', () => {
  const customerFacingSource = [
    read('./components/views/GoodsView.tsx'),
    read('./components/views/SystemView.tsx'),
    read('./components/views/TeacherClassView.tsx'),
    read('./components/modals/HelpModal.tsx'),
  ].join('\n');
  assert.doesNotMatch(customerFacingSource, /Token/i);
});

test('商品与权益页明确区分四个业务对象', () => {
  const source = read('./components/views/GoodsView.tsx');
  assert.match(source, /AI 加油包/);
  assert.match(source, /AI 用量/);
  assert.match(source, /机构点数/);
  assert.match(source, /学生权益/);
});
