import assert from 'node:assert/strict';
import test from 'node:test';
import { createGuardianBindingCode, deriveStudentRights } from './studentCodeManagement';
import type { AuthCode, StudentItem } from '../types';

const student = {
  id: 'STU-001', name: '王小明', nickname: '小明', account: 'wangxm', grade: '初一', school: '浙大附中', textbook: '人教版',
  institutionId: 'INS-001', institutionName: '浙江大学附属中学', teacherId: 'TCH-001', teacherName: '张老师', subjects: ['数学'],
  serviceStatus: 'active', serviceExpireAt: '2027-08-11', totalStudyHours: 10, totalQuestions: 100, accuracyRate: 80, errorCount: 20, unreviewedErrorCount: 5,
} satisfies StudentItem;

const authCode = {
  id: 'AC-001', code: 'KQ-1000-2000-3000', institutionId: 'INS-001', institutionName: '浙江大学附属中学', teacherId: 'TCH-001', teacherName: '张老师',
  studentId: 'STU-001', studentName: '王小明', packageId: 'PKG-001', packageName: '单科高量包', packageType: 'single_high', quotaConsumed: 120,
  createdAt: '2026-08-11 10:00', expireAt: '2026-09-10', activatedAt: '2026-08-11 10:10', status: 'used',
} satisfies AuthCode;

test('学生权益由学生授权码派生', () => {
  const [right] = deriveStudentRights([authCode]);
  assert.equal(right.studentName, '王小明');
  assert.equal(right.packageName, '单科高量包');
  assert.equal(right.statusLabel, '已生效');
});

test('家长绑定码独立生成并在七天后到期', () => {
  const code = createGuardianBindingCode(student, new Date('2026-08-11T00:00:00.000Z'), () => '2468');
  assert.equal(code.code, 'JB-2468-2468');
  assert.equal(code.status, 'pending');
  assert.equal(code.expireAt, '2026-08-18');
});
