import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthCode, ServicePackage } from '../types';
import { deriveLegacyServiceRights, mergeStudentServiceRights } from './studentRights';

const servicePackage: ServicePackage = {
  id: 'PKG-1', code: 'SP-1', name: '单科高量包', type: 'single_high', typeName: '单科高量', quotaCost: 120,
  includedAiUsage: 1000000, durationDays: 365, description: '测试服务包', status: 'active', subjectRequirement: 'single',
};

const code: AuthCode = {
  id: 'AC-1', code: 'KQ-1', institutionId: 'INS-1', institutionName: '测试学校', teacherId: 'TCH-1', teacherName: '李老师',
  studentId: 'STU-1', studentName: '王同学', packageId: 'PKG-1', packageName: '单科高量包', packageType: 'single_high',
  quotaConsumed: 120, createdAt: '2026-07-20 10:30', expireAt: '2026-08-19 10:30', activatedAt: '2026-07-21 14:20', status: 'used',
};

test('已有授权码自动补齐学生服务权益并保留关联关系', () => {
  const [right] = deriveLegacyServiceRights([code], [servicePackage]);

  assert.deepEqual(
    { studentId: right.studentId, authCodeId: right.authCodeId, includedAiUsage: right.includedAiUsage, quotaConsumed: right.quotaConsumed, status: right.status },
    { studentId: 'STU-1', authCodeId: 'AC-1', includedAiUsage: 1000000, quotaConsumed: 120, status: 'active' },
  );
  assert.equal(right.serviceExpireAt, '2027-07-21');
});

test('待激活、已过期和已作废授权码映射为对应权益状态', () => {
  const rights = deriveLegacyServiceRights([
    { ...code, id: 'AC-P', status: 'pending', activatedAt: undefined },
    { ...code, id: 'AC-E', status: 'expired', activatedAt: undefined },
    { ...code, id: 'AC-R', status: 'revoked', activatedAt: undefined },
  ], [servicePackage]);

  assert.deepEqual(rights.map((item) => item.status), ['pending', 'expired', 'revoked']);
  assert.deepEqual(rights.map((item) => item.serviceExpireAt), [null, null, null]);
});

test('没有指定学生的旧授权码不能伪造学生权益', () => {
  assert.deepEqual(deriveLegacyServiceRights([{ ...code, studentId: undefined, studentName: undefined }], [servicePackage]), []);
});

test('学生详情在权益记录缺失时用已有授权码补齐且不制造重复记录', () => {
  const existing = deriveLegacyServiceRights([code], [servicePackage]);
  const additionalCode = { ...code, id: 'AC-2', code: 'KQ-2', status: 'pending' as const, activatedAt: undefined };

  const records = mergeStudentServiceRights(existing, [code, additionalCode], [servicePackage]);

  assert.equal(records.length, 2);
  assert.deepEqual(records.map((item) => item.authCodeId), ['AC-1', 'AC-2']);
});
