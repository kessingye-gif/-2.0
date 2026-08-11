import assert from 'node:assert/strict';
import test from 'node:test';
import { filterStudents, getStudentFilterOptions } from './studentFilters';
import type { StudentItem } from '../types';

const makeStudent = (id: string, institutionName: string, teacherName: string, grade: string): StudentItem => ({
  id, name: id, nickname: id, account: id, grade, school: institutionName, textbook: '人教版', institutionId: institutionName,
  institutionName, teacherId: teacherName, teacherName, subjects: ['数学'], serviceStatus: 'active', totalStudyHours: 0,
  totalQuestions: 0, accuracyRate: 0, errorCount: 0, unreviewedErrorCount: 0,
});

const students = [
  makeStudent('甲', '一中', '张老师', '初一'),
  makeStudent('乙', '一中', '李老师', '初二'),
  makeStudent('丙', '二中', '王老师', '高一'),
];

test('组织筛选选项按机构和老师逐级收窄', () => {
  assert.deepEqual(getStudentFilterOptions(students, {}), { institutions: ['一中', '二中'], teachers: ['张老师', '李老师', '王老师'], grades: ['初一', '初二', '高一'] });
  assert.deepEqual(getStudentFilterOptions(students, { institution: '一中' }).teachers, ['张老师', '李老师']);
  assert.deepEqual(getStudentFilterOptions(students, { institution: '一中', teacher: '李老师' }).grades, ['初二']);
});

test('关键词、机构、老师、年级和服务状态共同过滤同一学生数据', () => {
  assert.deepEqual(filterStudents(students, { searchTerm: '乙', institution: '一中', teacher: '李老师', grade: '初二', serviceStatus: 'active' }).map((item) => item.id), ['乙']);
  assert.equal(filterStudents(students, { institution: '二中', grade: '初二' }).length, 0);
});
