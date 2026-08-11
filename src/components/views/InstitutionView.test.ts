import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./InstitutionView.tsx', import.meta.url), 'utf8');

test('机构分别配置内容包和服务包范围', () => {
  assert.match(source, /可用内容包/);
  assert.match(source, /可采购服务包/);
  assert.match(source, /内容包决定机构可使用的教学内容/);
  assert.match(source, /服务包决定机构可采购的点数与 AI 权益/);
  assert.doesNotMatch(source, /服务包包含内容包/);
});
