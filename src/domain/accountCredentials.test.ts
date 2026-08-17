import assert from 'node:assert/strict';
import test from 'node:test';
import { authenticateAccount, validateAccountCredentials } from './accountCredentials';

test('账号密码必填，手机号可以为空', () => {
  assert.equal(validateAccountCredentials({ username: 'teacher_01', password: 'Abcd!2345678', phone: '' }), '');
  assert.equal(validateAccountCredentials({ username: 'teacher_01', password: '', phone: '' }), '请设置登录密码');
});

test('认证仅接受已启用账号的精确密码', () => {
  const accounts = [{ id: 'A1', username: 'admin', password: 'Abcd!2345678', status: 'active' as const }];
  assert.equal(authenticateAccount(accounts, 'admin', 'Abcd!2345678')?.id, 'A1');
  assert.equal(authenticateAccount(accounts, 'admin-x', 'Abcd!2345678'), undefined);
  assert.equal(authenticateAccount(accounts, 'admin', 'wrong'), undefined);
});

test('停用账号不能登录', () => {
  const accounts = [{ id: 'A1', username: 'admin', password: 'Abcd!2345678', status: 'inactive' as const }];
  assert.equal(authenticateAccount(accounts, 'admin', 'Abcd!2345678'), undefined);
});
