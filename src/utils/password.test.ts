import assert from 'node:assert/strict';
import test from 'node:test';
import { generateRandomPassword, getPasswordValidationMessage } from './password';

test('随机密码满足统一复杂度规则', () => {
  const password = generateRandomPassword();
  assert.equal(password.length, 14);
  assert.equal(getPasswordValidationMessage(password), '');
});

test('复杂度校验明确提示缺失规则', () => {
  assert.match(getPasswordValidationMessage('simple-password'), /12 位|大写/);
  assert.match(getPasswordValidationMessage('PasswordOnly12'), /特殊字符/);
});
