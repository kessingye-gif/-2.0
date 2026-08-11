import assert from 'node:assert/strict';
import test from 'node:test';
import { can, type AccessPrincipal } from './accessControl';

const superAdmin: AccessPrincipal = { id: 'SA-1', role: 'super_admin' };
const institutionAdmin: AccessPrincipal = { id: 'IA-1', role: 'institution_admin', institutionId: 'INS-1' };
const teacher: AccessPrincipal = { id: 'T-1', role: 'teacher', institutionId: 'INS-1', teacherId: 'T-1' };

test('超级管理员可在任意明确机构范围使用下级能力', () => {
  assert.equal(can(superAdmin, 'teacher.import', { institutionId: 'INS-2' }), true);
  assert.equal(can(superAdmin, 'teacher.allocateQuota', { institutionId: 'INS-2', teacherId: 'T-8' }), true);
  assert.equal(can(superAdmin, 'student.manage', { institutionId: 'INS-2', teacherId: 'T-8' }), true);
});

test('机构管理员只能管理本机构', () => {
  assert.equal(can(institutionAdmin, 'teacher.import', { institutionId: 'INS-1' }), true);
  assert.equal(can(institutionAdmin, 'teacher.import', { institutionId: 'INS-2' }), false);
});

test('老师只能管理自己负责的学生与学习数据', () => {
  assert.equal(can(teacher, 'student.manage', { institutionId: 'INS-1', teacherId: 'T-1' }), true);
  assert.equal(can(teacher, 'learning.view', { institutionId: 'INS-1', teacherId: 'T-1' }), true);
  assert.equal(can(teacher, 'student.manage', { institutionId: 'INS-1', teacherId: 'T-2' }), false);
  assert.equal(can(teacher, 'teacher.import', { institutionId: 'INS-1' }), false);
});

test('所有业务操作都必须有明确机构范围', () => {
  assert.equal(can(superAdmin, 'teacher.import', {}), false);
});
