import assert from 'node:assert/strict';
import test from 'node:test';
import type { ServicePackage, StudentItem } from '../types';
import { createBulkServiceFulfillments, createServiceFulfillment } from './serviceFulfillment';

const student: StudentItem = {
  id: 'STU-001', name: '王小明', nickname: '小明', account: 'wangxm', grade: '初一', school: '浙大附中', textbook: '人教版',
  institutionId: 'INS-001', institutionName: '浙江大学附属中学', teacherId: 'TCH-001', teacherName: '张老师', subjects: ['数学'],
  serviceStatus: 'none', totalStudyHours: 0, totalQuestions: 0, accuracyRate: 0, errorCount: 0, unreviewedErrorCount: 0,
};

const servicePackage: ServicePackage = {
  id: 'PKG-002', code: 'SP-SINGLE-HIGH', name: '单科高量包', type: 'single_high', typeName: '单科高量', quotaCost: 100,
  includedAiUsage: 1000000, durationDays: 365, description: '演示服务包', status: 'active', subjectRequirement: 'single',
};

test('一次办理同时产生双码和待激活权益', () => {
  const result = createServiceFulfillment({ student, servicePackage, now: new Date('2026-08-12T02:00:00.000Z'), nonce: '1234' });
  assert.equal(result.authCode.studentId, 'STU-001');
  assert.equal(result.guardianBindingCode.studentId, 'STU-001');
  assert.equal(result.right.status, 'pending');
  assert.equal(result.right.packageName, '单科高量包');
  assert.equal(result.right.authCodeId, result.authCode.id);
});

test('停用服务包不能办理', () => {
  assert.throws(() => createServiceFulfillment({ student, servicePackage: { ...servicePackage, status: 'inactive' }, now: new Date(), nonce: '1234' }), /服务包已停用/);
});

test('缺失机构或负责教师的学生不能办理', () => {
  assert.throws(() => createServiceFulfillment({ student: { ...student, teacherId: '', teacherName: '' }, servicePackage, now: new Date(), nonce: '1234' }), /缺少负责教师/);
});

test('班级批量办理为每名学生生成独立双码并汇总教师应扣点数', () => {
  const result = createBulkServiceFulfillments({
    students: [student, { ...student, id: 'STU-002', name: '李同学' }],
    servicePackage,
    now: new Date('2026-08-12T02:00:00.000Z'),
    nonce: 'B001',
  });

  assert.equal(result.totalQuotaConsumed, 200);
  assert.equal(result.results.length, 2);
  assert.notEqual(result.results[0].authCode.code, result.results[1].authCode.code);
  assert.deepEqual(result.results.map((item) => item.right.studentId), ['STU-001', 'STU-002']);
});
