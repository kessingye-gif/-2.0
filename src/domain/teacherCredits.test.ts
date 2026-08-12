import assert from 'node:assert/strict';
import test from 'node:test';
import type { Institution, TeacherItem } from '../types';
import { allocateTeacherCredits, debitTeacherForService, reclaimTeacherCredits } from './teacherCredits';

const institution: Institution = {
  id: 'INS-1', name: '测试学校', code: 'TEST', region: 'huadong', regionName: '华东地区',
  contactPerson: '负责人', phone: '13800000000', email: 'test@example.com', adminAccount: 'admin',
  totalQuota: 10000, remainingQuota: 10000, teacherCount: 1, studentCount: 1, status: 'active',
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

const teacher: TeacherItem = {
  id: 'TCH-1', name: '李老师', account: 'teacher', phone: '13800000001', institutionId: 'INS-1', institutionName: '测试学校',
  studentCount: 1, allocatedQuota: 0, remainingQuota: 0,
  permissions: { canEditContent: true, canImportStudents: true, canManageClass: true, canRedeemPackage: true, canViewReport: true },
  status: 'active', createdAt: '2026-01-01',
};

test('机构给教师分配 2000 点时双方余额同时更新并生成同一笔流水', () => {
  const result = allocateTeacherCredits({ institution, teacher, amount: 2000, reason: '新班级启动', now: new Date('2026-08-12T08:00:00Z'), nonce: '001' });

  assert.equal(result.institution.remainingQuota, 8000);
  assert.equal(result.teacher.allocatedQuota, 2000);
  assert.equal(result.teacher.remainingQuota, 2000);
  assert.deepEqual(
    { type: result.entry.type, amount: result.entry.amount, institutionBefore: result.entry.institutionBefore, institutionAfter: result.entry.institutionAfter, teacherBefore: result.entry.teacherBefore, teacherAfter: result.entry.teacherAfter },
    { type: 'institution_to_teacher', amount: 2000, institutionBefore: 10000, institutionAfter: 8000, teacherBefore: 0, teacherAfter: 2000 },
  );
});

test('机构余额不足时不能给教师分配点数', () => {
  assert.throws(
    () => allocateTeacherCredits({ institution: { ...institution, remainingQuota: 100 }, teacher, amount: 200, reason: '超额分配', now: new Date(), nonce: '002' }),
    /机构剩余点数不足/,
  );
});

test('机构只能收回教师当前尚未使用的点数', () => {
  const allocatedTeacher = { ...teacher, allocatedQuota: 200, remainingQuota: 80 };
  assert.throws(
    () => reclaimTeacherCredits({ institution: { ...institution, remainingQuota: 9800 }, teacher: allocatedTeacher, amount: 120, reason: '错误收回', now: new Date(), nonce: '003' }),
    /教师可用点数不足/,
  );

  const result = reclaimTeacherCredits({ institution: { ...institution, remainingQuota: 9800 }, teacher: allocatedTeacher, amount: 80, reason: '班级结束', now: new Date(), nonce: '004' });
  assert.equal(result.institution.remainingQuota, 9880);
  assert.equal(result.teacher.remainingQuota, 0);
  assert.equal(result.teacher.allocatedQuota, 120);
});

test('教师为学生办理 120 点服务后从 200 点变为 80 点', () => {
  const result = debitTeacherForService({ teacher: { ...teacher, allocatedQuota: 200, remainingQuota: 200 }, amount: 120, studentId: 'STU-1', studentName: '王同学', packageId: 'PKG-1', packageName: '单科高量包', now: new Date('2026-08-12T08:00:00Z'), nonce: '005' });

  assert.equal(result.teacher.remainingQuota, 80);
  assert.equal(result.entry.type, 'teacher_service_debit');
  assert.equal(result.entry.teacherBefore, 200);
  assert.equal(result.entry.teacherAfter, 80);
});

test('教师余额不足时不能办理学生服务', () => {
  assert.throws(
    () => debitTeacherForService({ teacher: { ...teacher, remainingQuota: 80 }, amount: 120, studentId: 'STU-1', studentName: '王同学', packageId: 'PKG-1', packageName: '单科高量包', now: new Date(), nonce: '006' }),
    /教师剩余点数不足/,
  );
});
