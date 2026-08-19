import type { Institution, StudentItem, TeacherItem } from '../types';
import { getPasswordValidationMessage } from '../utils/password';

export interface StudentImportRow {
  学生姓名?: unknown;
  登录账号?: unknown;
  登录密码?: unknown;
  手机号?: unknown;
  负责教师姓名?: unknown;
  '负责教师姓名（选填）'?: unknown;
  年级?: unknown;
  '班级（选填）'?: unknown;
}

export function buildImportedStudents(rows: StudentImportRow[], institution: Institution, teachers: TeacherItem[], existingStudents: StudentItem[], now = new Date()) {
  const institutionTeachers = teachers.filter((item) => item.institutionId === institution.id);
  const existingAccounts = new Set(existingStudents.map((item) => item.account.toLowerCase()));
  const batchAccounts = new Set<string>();
  const errors: string[] = [];
  const skipped: string[] = [];
  const students = rows.flatMap((row, index) => {
    const line = index + 2;
    const name = String(row.学生姓名 ?? '').trim();
    const account = String(row.登录账号 ?? '').trim();
    const loginPassword = String(row.登录密码 ?? '').trim();
    const phone = String(row.手机号 ?? '').trim();
    const teacherName = String(row['负责教师姓名（选填）'] ?? row.负责教师姓名 ?? '').trim();
    const grade = String(row.年级 ?? '').trim();
    const className = String(row['班级（选填）'] ?? '').trim();
    if (account && existingAccounts.has(account.toLowerCase())) {
      skipped.push(`第 ${line} 行：登录账号 ${account} 已存在，已保留原数据`);
      return [];
    }
    if (!name || !account || !loginPassword || !phone || !grade) {
      errors.push(`第 ${line} 行：学生姓名、登录账号、登录密码、手机号和年级必填`);
      return [];
    }
    const matchedTeachers = teacherName ? institutionTeachers.filter((item) => item.name === teacherName) : [];
    if (teacherName && matchedTeachers.length === 0) {
      errors.push(`第 ${line} 行：本机构不存在教师“${teacherName}”`);
      return [];
    }
    if (teacherName && matchedTeachers.length > 1) {
      errors.push(`第 ${line} 行：教师姓名“${teacherName}”重复，无法唯一匹配`);
      return [];
    }
    const teacher = matchedTeachers[0] ?? null;
    if (teacher && teacher.status !== 'active') {
      errors.push(`第 ${line} 行：负责教师“${teacher.name}”已停用`);
      return [];
    }
    const passwordMessage = getPasswordValidationMessage(loginPassword);
    if (passwordMessage) {
      errors.push(`第 ${line} 行：${passwordMessage}`);
      return [];
    }
    if (!/^1\d{10}$/.test(phone.replace(/[-\s]/g, ''))) {
      errors.push(`第 ${line} 行：手机号格式不正确`);
      return [];
    }
    if (batchAccounts.has(account.toLowerCase())) {
      errors.push(`第 ${line} 行：登录账号 ${account} 在本次表格中重复`);
      return [];
    }
    batchAccounts.add(account.toLowerCase());
    return [{
      id: `STU-IMP-${now.getTime()}-${index + 1}`,
      name,
      nickname: `${name}同学`,
      account,
      phone,
      loginPassword,
      grade,
      school: institution.name,
      textbook: '人教版',
      institutionId: institution.id,
      institutionName: institution.name,
      teacherId: teacher?.id ?? '',
      teacherName: teacher?.name ?? '机构管理员待分配',
      className: className || undefined,
      subjects: [],
      serviceStatus: 'none' as const,
      totalStudyHours: 0,
      totalQuestions: 0,
      accuracyRate: 0,
      errorCount: 0,
      unreviewedErrorCount: 0,
    }];
  });
  return { students, errors, skipped };
}
