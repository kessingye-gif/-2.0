import assert from 'node:assert/strict';
import test from 'node:test';
import { getTeacherStudentSubjectScope, scopeInstitutions, scopeStudents, scopeTeachers } from './dataScope';

const institutions = [{ id: 'I-1' }, { id: 'I-2' }];
const teachers = [{ id: 'T-1', institutionId: 'I-1' }, { id: 'T-2', institutionId: 'I-1' }, { id: 'T-3', institutionId: 'I-2' }];
const students = [
  { id: 'S-1', institutionId: 'I-1', teacherId: 'T-1' },
  { id: 'S-2', institutionId: 'I-1', teacherId: 'T-2', teacherAssignments: [{ teacherId: 'T-1' }] },
  { id: 'S-3', institutionId: 'I-2', teacherId: 'T-3' },
];

test('超级管理员看到全部组织数据', () => {
  const principal = { role: 'super_admin' as const };
  assert.equal(scopeInstitutions(institutions, principal).length, 2);
  assert.equal(scopeTeachers(teachers, principal).length, 3);
  assert.equal(scopeStudents(students, principal).length, 3);
});

test('机构管理员只看到本机构的老师和学生', () => {
  const principal = { role: 'institution_admin' as const, institutionId: 'I-1' };
  assert.deepEqual(scopeInstitutions(institutions, principal).map((item) => item.id), ['I-1']);
  assert.deepEqual(scopeTeachers(teachers, principal).map((item) => item.id), ['T-1', 'T-2']);
  assert.deepEqual(scopeStudents(students, principal).map((item) => item.id), ['S-1', 'S-2']);
});

test('教师只看到本人及本人负责的学生', () => {
  const principal = { role: 'teacher' as const, institutionId: 'I-1', teacherId: 'T-1' };
  assert.deepEqual(scopeInstitutions(institutions, principal).map((item) => item.id), ['I-1']);
  assert.deepEqual(scopeTeachers(teachers, principal).map((item) => item.id), ['T-1']);
  assert.deepEqual(scopeStudents(students, principal).map((item) => item.id), ['S-1', 'S-2']);
});

test('缺少归属标识时下级角色看不到跨范围数据', () => {
  assert.deepEqual(scopeStudents(students, { role: 'teacher', institutionId: 'I-1' }), []);
  assert.deepEqual(scopeTeachers(teachers, { role: 'institution_admin' }), []);
});

test('主负责教师看全部学科，任课教师只看被分配学科', () => {
  const student = {
    teacherId: 'T-MAIN',
    subjects: ['数学', '物理', '生物'],
    teacherAssignments: [
      { teacherId: 'T-PHYSICS', subject: '物理' },
      { teacherId: 'T-BIOLOGY', subject: '生物' },
    ],
  };
  assert.equal(getTeacherStudentSubjectScope(student, 'T-MAIN'), 'all');
  assert.deepEqual(getTeacherStudentSubjectScope(student, 'T-PHYSICS'), ['物理']);
  assert.deepEqual(getTeacherStudentSubjectScope(student, 'T-BIOLOGY'), ['生物']);
  assert.equal(getTeacherStudentSubjectScope(student, 'T-OTHER'), null);
});
