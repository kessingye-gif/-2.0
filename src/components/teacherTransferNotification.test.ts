import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('学生转让同时通知转入和转出教师并记录来源', () => {
  const source = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

  assert.match(source, /student_transfer/);
  assert.match(source, /student_transfer_out/);
  assert.match(source, /由\$\{previousOwnerName\}转入/);
  assert.match(source, /已转让给\$\{teacher\.name\}/);
  assert.match(source, /操作人：\$\{currentUser\.name\}/);
  assert.match(source, /recipientTeacherId: teacher\.id/);
  assert.match(source, /recipientTeacherId: previousTeacher\.id/);
});

test('教师点击转让通知后进入学生管理并消除该条未读', () => {
  const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const headerSource = readFileSync(new URL('./layout/Header.tsx', import.meta.url), 'utf8');

  assert.match(appSource, /alertId\.startsWith\('transfer-'\)/);
  assert.match(appSource, /current\.filter\(\(item\) => item\.id !== alertId\)/);
  assert.match(headerSource, /onSelectNotification\?\.\(alert\.targetTab, alert\.id\)/);
});
