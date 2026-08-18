import assert from 'node:assert/strict';
import test from 'node:test';
import type { ContentPackageItem, Institution, ServicePackage, StudentItem } from '../types';
import { activateStudentService, createBulkServiceFulfillments, createServiceFulfillment, settleInstitutionServiceFulfillments } from './serviceFulfillment';

const student: StudentItem = {
  id: 'STU-001', name: '王小明', nickname: '小明', account: 'wangxm', grade: '初一', school: '浙大附中', textbook: '人教版',
  institutionId: 'INS-001', institutionName: '浙江大学附属中学', teacherId: 'TCH-001', teacherName: '张老师', subjects: ['数学'],
  serviceStatus: 'none', totalStudyHours: 0, totalQuestions: 0, accuracyRate: 0, errorCount: 0, unreviewedErrorCount: 0,
};

const servicePackage: ServicePackage = {
  id: 'PKG-002', code: 'SP-SINGLE-HIGH', name: '单科高量包', type: 'single_high', typeName: '单科高量', quotaCost: 100,
  includedAiUsage: 1000000, durationDays: 365, description: '演示服务包', status: 'active', subjectRequirement: 'single',
};

const contentPackage: ContentPackageItem = {
  id: 'CP-01', code: 'CP-MATH', name: '初中数学内容包', subjectId: 'SUB-01', subject: '初中数学', stage: '初中', kpCount: 10, questionCount: 100,
  status: 'active', description: '测试内容包',
};

const institution: Institution = {
  id: 'INS-001', name: '浙江大学附属中学', code: 'ZJU', region: 'huadong', regionName: '华东地区',
  contactPerson: '李老师', phone: '13800000000', email: 'school@example.com', adminAccount: 'admin_zju',
  totalQuota: 1000, remainingQuota: 500, availableServicePackageIds: ['PKG-002'], teacherCount: 1, studentCount: 2,
  status: 'active', createdAt: '2026-08-01', updatedAt: '2026-08-01',
};

test('一次办理同时产生双码和待激活权益', () => {
  const result = createServiceFulfillment({ student, servicePackage, now: new Date('2026-08-12T02:00:00.000Z'), nonce: '1234' });
  assert.equal(result.authCode!.studentId, 'STU-001');
  assert.equal(result.guardianBindingCode!.studentId, 'STU-001');
  assert.equal(result.right.status, 'pending');
  assert.equal(result.right.packageName, '单科高量包');
  assert.equal(result.right.authCodeId, result.authCode!.id);
  assert.equal(result.right.serviceExpireAt, null);
});

test('停用服务包不能办理', () => {
  assert.throws(() => createServiceFulfillment({ student, servicePackage: { ...servicePackage, status: 'inactive' }, now: new Date(), nonce: '1234' }), /服务包已停用/);
});

test('教师归属为空时仍可办理，机构归属必须存在', () => {
  const result = createServiceFulfillment({ student: { ...student, teacherId: '', teacherName: '' }, servicePackage, now: new Date(), nonce: '1234' });
  assert.equal(result.right.institutionId, 'INS-001');
  assert.equal(result.right.teacherId, '');
  assert.throws(() => createServiceFulfillment({ student: { ...student, institutionId: '', institutionName: '' }, servicePackage, now: new Date(), nonce: '1234' }), /缺少所属机构/);
});

test('批量办理可跨教师并汇总机构应扣点数', () => {
  const result = createBulkServiceFulfillments({
    students: [student, { ...student, id: 'STU-002', name: '李同学', teacherId: 'TCH-002', teacherName: '李老师' }],
    servicePackage,
    now: new Date('2026-08-12T02:00:00.000Z'),
    nonce: 'B001',
  });

  assert.equal(result.totalQuotaConsumed, 200);
  assert.equal(result.results.length, 2);
  assert.notEqual(result.results[0].authCode!.code, result.results[1].authCode!.code);
  assert.deepEqual(result.results.map((item) => item.right.studentId), ['STU-001', 'STU-002']);
});

test('服务开通从所属机构统一账户扣点并生成机构流水', () => {
  const fulfillment = createServiceFulfillment({ student, servicePackage, now: new Date('2026-08-12T02:00:00.000Z'), nonce: '1234' });
  const settled = settleInstitutionServiceFulfillments({
    institution,
    results: [fulfillment],
    existingRightIds: [],
    operatorName: '超级管理员',
    now: new Date('2026-08-12T02:01:00.000Z'),
    nonce: 'SETTLE-1',
  });

  assert.equal(settled.institution.remainingQuota, 400);
  assert.equal(settled.order.creditChange, -100);
  assert.equal(settled.order.institutionId, 'INS-001');
  assert.match(settled.order.reason ?? '', /王小明/);
});

test('机构余额不足时不产生扣点结果', () => {
  const fulfillment = createServiceFulfillment({ student, servicePackage, now: new Date(), nonce: '1234' });
  assert.throws(() => settleInstitutionServiceFulfillments({
    institution: { ...institution, remainingQuota: 99 }, results: [fulfillment], existingRightIds: [],
    operatorName: '超级管理员', now: new Date(), nonce: 'SETTLE-2',
  }), /机构剩余点数不足/);
});

test('重复权益不能再次扣除机构点数', () => {
  const fulfillment = createServiceFulfillment({ student, servicePackage, now: new Date(), nonce: '1234' });
  assert.throws(() => settleInstitutionServiceFulfillments({
    institution, results: [fulfillment], existingRightIds: [fulfillment.right.id],
    operatorName: '超级管理员', now: new Date(), nonce: 'SETTLE-3',
  }), /请勿重复提交/);
});

test('开通结果保存真实内容包权益', () => {
  const result = createServiceFulfillment({ student, servicePackage, contentPackages: [contentPackage], now: new Date(), nonce: 'CONTENT' });
  assert.deepEqual(result.right.contentPackageIds, ['CP-01']);
  assert.deepEqual(result.right.contentPackageNames, ['初中数学内容包']);
});

test('同一服务可选择多个内容包且只生成一笔服务权益', () => {
  const secondContentPackage = { ...contentPackage, id: 'CP-02', code: 'CP-PHYS', name: '初中物理内容包', subjectId: 'SUB-02', subject: '初中物理' };
  const result = createServiceFulfillment({
    student,
    servicePackage: { ...servicePackage, selectableContentPackageIds: ['CP-01', 'CP-02'], selectableContentPackageCount: 1 },
    contentPackages: [contentPackage, secondContentPackage],
    now: new Date(),
    nonce: 'MULTI',
  });
  assert.deepEqual(result.right.contentPackageIds, ['CP-01', 'CP-02']);
  assert.equal(result.right.quotaConsumed, servicePackage.quotaCost);
});

test('已有待激活同款服务时拒绝重复办理', () => {
  const pending = createServiceFulfillment({ student, servicePackage, now: new Date(), nonce: 'FIRST' }).right;
  assert.throws(() => createServiceFulfillment({ student, servicePackage, existingRights: [pending], now: new Date(), nonce: 'SECOND' }), /已有待激活/);
});

test('续费从当前有效期顺延', () => {
  const activeRight = { ...createServiceFulfillment({ student, servicePackage, now: new Date('2026-01-01'), nonce: 'ACTIVE' }).right, status: 'active' as const, serviceExpireAt: '2027-01-01' };
  const renewal = createServiceFulfillment({ student, servicePackage, existingRights: [activeRight], now: new Date('2026-08-17'), nonce: 'RENEW' });
  assert.equal(renewal.right.fulfillmentKind, 'renewal');
  assert.equal(renewal.right.serviceExpireAt, '2028-01-01');
  assert.equal(renewal.right.id, activeRight.id);
  assert.equal(renewal.right.status, 'active');
  assert.equal(renewal.authCode, undefined);
  assert.equal(renewal.guardianBindingCode, undefined);
});

test('首次激活当天开始计算有效期', () => {
  const fulfillment = createServiceFulfillment({ student, servicePackage, now: new Date('2026-08-01'), nonce: 'FIRST' });
  const activated = activateStudentService({ right: fulfillment.right, authCode: fulfillment.authCode!, servicePackage, activatedAt: new Date('2026-09-10T02:00:00.000Z') });
  assert.equal(activated.authCode.status, 'used');
  assert.equal(activated.right.status, 'active');
  assert.equal(activated.right.serviceExpireAt, '2027-09-10');
});
