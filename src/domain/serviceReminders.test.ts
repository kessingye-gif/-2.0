import assert from 'node:assert/strict';
import test from 'node:test';
import type { StudentServiceRight } from '../types';
import { deriveStudentServiceReminders } from './serviceReminders';

const createRight = (changes: Partial<StudentServiceRight> = {}): StudentServiceRight => ({
  id: 'RIGHT-1',
  studentId: 'STU-1',
  studentName: '张三',
  institutionId: 'INS-1',
  institutionName: '机构',
  teacherId: 'T-1',
  teacherName: '老师',
  packageId: 'PKG-1',
  packageName: '标准服务包',
  authCodeId: 'AUTH-1',
  includedAiUsage: 100,
  quotaConsumed: 10,
  createdAt: '2026-08-01T00:00:00.000Z',
  serviceExpireAt: null,
  status: 'pending',
  ...changes,
});

test('待激活满三天的权益生成激活提醒', () => {
  const reminders = deriveStudentServiceReminders([createRight()], new Date('2026-08-04T00:00:00.000Z'));

  assert.deepEqual(reminders.map((item) => item.kind), ['activation']);
  assert.match(reminders[0].description, /联系学生完成激活/);
});

test('七天内到期的服务中权益生成续办提醒', () => {
  const reminders = deriveStudentServiceReminders([
    createRight({ status: 'active', serviceExpireAt: '2026-08-21' }),
  ], new Date('2026-08-15T00:00:00.000Z'));

  assert.deepEqual(reminders.map((item) => item.kind), ['renewal']);
});

test('已到期权益生成到期提醒', () => {
  const reminders = deriveStudentServiceReminders([
    createRight({ status: 'expired', serviceExpireAt: '2026-08-14' }),
  ], new Date('2026-08-15T00:00:00.000Z'));

  assert.deepEqual(reminders.map((item) => item.kind), ['expired']);
});

test('未满足任何规则的权益不生成提醒', () => {
  const reminders = deriveStudentServiceReminders([
    createRight({ createdAt: '2026-08-02T00:00:00.000Z' }),
    createRight({ id: 'RIGHT-2', status: 'active', serviceExpireAt: '2026-08-23' }),
    createRight({ id: 'RIGHT-3', status: 'revoked' }),
  ], new Date('2026-08-04T00:00:00.000Z'));

  assert.deepEqual(reminders, []);
});
