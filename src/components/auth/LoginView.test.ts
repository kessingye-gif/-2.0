import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('登录页仅执行精确账号密码认证', () => {
  const source = readFileSync(new URL('./LoginView.tsx', import.meta.url), 'utf8');
  assert.match(source, /authenticateAccount/);
  assert.doesNotMatch(source, /includes\(i\.code/);
  assert.match(source, /账号密码为必备登录方式/);
});
