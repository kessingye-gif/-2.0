import assert from 'node:assert/strict';
import test from 'node:test';
import { initialInstitutions, initialStudents, initialTeachers } from '../mockData';
import { buildImportedStudents } from './studentImport';

test('导入学生时按 Excel 教师姓名直接归属，班级保持选填', () => {
  const result = buildImportedStudents([{
    学生姓名: '赵同学', 登录账号: 'zhao2026', 登录密码: 'Student@2026!', 手机号: '13800000002', 负责教师姓名: initialTeachers[0].name, 年级: '初二', '班级（选填）': '初二（3）班',
  }], initialInstitutions[0], initialTeachers, initialStudents, new Date('2026-08-18T00:00:00Z'));

  assert.deepEqual(result.errors, []);
  assert.equal(result.students[0].teacherId, initialTeachers[0].id);
  assert.equal(result.students[0].className, '初二（3）班');
  assert.equal(result.students[0].phone, '13800000002');
  assert.equal(result.students[0].loginPassword, 'Student@2026!');
  assert.deepEqual(result.students[0].subjects, []);
});

test('重复导入旧表时跳过已有账号，只校验新增行', () => {
  const result = buildImportedStudents([
    { 学生姓名: '重复学生', 登录账号: initialStudents[0].account, 登录密码: 'Student@2026!', 手机号: '13800000003', 负责教师姓名: initialTeachers[0].name, 年级: '初一' },
    { 学生姓名: '缺年级', 登录账号: 'missing-grade' },
  ], initialInstitutions[0], initialTeachers, initialStudents);

  assert.equal(result.students.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.errors.length, 1);
});

test('导入拒绝本机构不存在的负责教师', () => {
  const result = buildImportedStudents([{
    学生姓名: '赵同学', 登录账号: 'zhao2027', 登录密码: 'Student@2026!', 手机号: '13800000004', 负责教师姓名: '不存在老师', 年级: '初二',
  }], initialInstitutions[0], initialTeachers, initialStudents);
  assert.match(result.errors[0], /不存在教师/);
});

test('学生导入不包含学科字段', () => {
  const result = buildImportedStudents([{
    学生姓名: '无学科学生', 登录账号: 'no-subject-2026', 登录密码: 'Student@2026!', 手机号: '13800000005', 负责教师姓名: initialTeachers[0].name, 年级: '初一',
  }], initialInstitutions[0], initialTeachers, initialStudents);
  assert.deepEqual(result.students[0].subjects, []);
});

test('未选择教师时由机构管理员暂管，后续可再分配', () => {
  const result = buildImportedStudents([{
    学生姓名: '待分配学生', 登录账号: 'unassigned-2026', 登录密码: 'Student@2026!', 手机号: '13800000006', 年级: '初一',
  }], initialInstitutions[0], initialTeachers, initialStudents, new Date('2026-08-18T00:00:00Z'));

  assert.deepEqual(result.errors, []);
  assert.equal(result.students[0].teacherId, '');
  assert.equal(result.students[0].teacherName, '机构管理员待分配');
});
